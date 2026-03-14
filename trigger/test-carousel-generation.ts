import {
  TEST_CAROUSEL_SLIDE_DEFINITIONS,
  TEST_CAROUSEL_SLIDES_COUNT,
} from "@/features/tests/schema";
import { generateTestCarouselSlideImage } from "@/lib/ai/functions";
import { deleteFile, getFileBuffer, uploadFile } from "@/lib/r2/functions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NoImageGeneratedError } from "ai";
import { logger, task } from "@trigger.dev/sdk/v3";
import { z } from "zod";

const testCarouselGenerationPayloadSchema = z.object({
  testId: z.string().uuid(),
  slideOrder: z.number().int().min(0).max(TEST_CAROUSEL_SLIDES_COUNT - 1),
});

type TestCarouselGenerationPayload = z.infer<
  typeof testCarouselGenerationPayloadSchema
>;

function sanitizeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 600);
  }

  return String(error).slice(0, 600);
}

function safePromptPreview(prompt: string, maxLength = 280) {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
}

function sanitizeForLog(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function extractErrorDetails(error: unknown) {
  if (error instanceof NoImageGeneratedError) {
    return {
      type: "NoImageGeneratedError",
      message: error.message,
      responses: (error.responses ?? []).map((response) => ({
        modelId: response.modelId,
        timestamp:
          response.timestamp instanceof Date
            ? response.timestamp.toISOString()
            : null,
        hasHeaders: Boolean(response.headers),
      })),
    };
  }

  if (error instanceof Error) {
    const candidate = error as Error & {
      statusCode?: number;
      url?: string;
      cause?: unknown;
      responseBody?: unknown;
      requestBodyValues?: unknown;
      responseHeaders?: unknown;
    };

    return {
      type: candidate.name,
      message: candidate.message,
      stack: candidate.stack?.split("\n").slice(0, 5).join("\n"),
      statusCode:
        typeof candidate.statusCode === "number" ? candidate.statusCode : null,
      url: typeof candidate.url === "string" ? candidate.url : null,
      responseBody:
        candidate.responseBody !== undefined
          ? sanitizeForLog(candidate.responseBody)
          : null,
      requestBodyValues:
        candidate.requestBodyValues !== undefined
          ? sanitizeForLog(candidate.requestBodyValues)
          : null,
      responseHeaders:
        candidate.responseHeaders !== undefined
          ? sanitizeForLog(candidate.responseHeaders)
          : null,
      cause:
        candidate.cause !== undefined ? sanitizeForLog(candidate.cause) : null,
    };
  }

  return {
    type: "UnknownError",
    value: sanitizeForLog(error),
  };
}

function fileExtensionFromMediaType(mediaType: string) {
  if (mediaType.includes("png")) {
    return "png";
  }

  if (mediaType.includes("jpeg") || mediaType.includes("jpg")) {
    return "jpg";
  }

  if (mediaType.includes("webp")) {
    return "webp";
  }

  return "png";
}

export const testCarouselGenerationTask = task({
  id: "test-carousel-generation",
  run: async (payload: TestCarouselGenerationPayload) => {
    const parsedPayload = testCarouselGenerationPayloadSchema.parse(payload);
    const { testId, slideOrder } = parsedPayload;
    const slideDefinition = TEST_CAROUSEL_SLIDE_DEFINITIONS.find(
      (slide) => slide.order === slideOrder,
    );

    if (!slideDefinition) {
      throw new Error("Slide configuration not found");
    }

    logger.log("Starting slide image generation", {
      testId,
      slideOrder,
    });

    const { data: slide, error: slideError } = await supabaseAdmin
      .from("test_slide")
      .select("id, order, copy, image_prompt, image_file_key")
      .eq("test_id", testId)
      .eq("kind", slideDefinition.kind)
      .maybeSingle();

    if (slideError) {
      throw slideError;
    }

    if (!slide) {
      throw new Error("Slide not found");
    }

    if (!slide.copy?.trim()) {
      throw new Error("Missing slide copy");
    }

    if (!slide.image_prompt?.trim()) {
      throw new Error("Missing image prompt");
    }

    try {
      let styleReferenceImage: Buffer | undefined;

      if (slide.order > 0) {
        const { data: firstSlide, error: firstSlideError } = await supabaseAdmin
          .from("test_slide")
          .select("id, order, image_file_key")
          .eq("test_id", testId)
          .eq("kind", "intro")
          .maybeSingle();

        if (firstSlideError) {
          throw firstSlideError;
        }

        if (!firstSlide?.image_file_key) {
          throw new Error("Generate slide 1 image before generating this slide");
        }

        styleReferenceImage = await getFileBuffer(firstSlide.image_file_key);

        logger.log("Loaded style reference image", {
          testId,
          slideId: slide.id,
          order: slide.order,
          referenceSlideId: firstSlide.id,
          referenceOrder: firstSlide.order,
          referenceByteLength: styleReferenceImage.byteLength,
        });
      }

      logger.log("Generating image for slide", {
        testId,
        slideId: slide.id,
        order: slide.order,
        promptLength: slide.image_prompt.length,
        promptPreview: safePromptPreview(slide.image_prompt),
        copyLength: slide.copy.length,
        copyPreview: safePromptPreview(slide.copy),
        hasStyleReference: Boolean(styleReferenceImage),
      });

      const generatedImage = await generateTestCarouselSlideImage({
        imagePrompt: slide.image_prompt,
        slideCopy: slide.copy,
        styleReferenceImage,
      });

      logger.log("Image generation response received", {
        testId,
        slideId: slide.id,
        order: slide.order,
        mediaType: generatedImage.mediaType,
        byteLength: generatedImage.data.byteLength,
        debug: sanitizeForLog(generatedImage.debug),
      });

      const extension = fileExtensionFromMediaType(generatedImage.mediaType);
      const key = `test-slides/${testId}/slide-${slide.order + 1}-${Date.now()}-${crypto.randomUUID()}.${extension}`;

      await uploadFile({
        key,
        body: generatedImage.data,
        contentType: generatedImage.mediaType,
      });

      await supabaseAdmin
        .from("test_slide")
        .update({
          image_file_key: key,
          generation_status: "completed",
          generation_error: null,
        })
        .eq("id", slide.id)
        .eq("test_id", testId)
        .throwOnError();

      if (slide.image_file_key && slide.image_file_key !== key) {
        await deleteFile(slide.image_file_key).catch(() => {});
      }

      logger.log("Completed slide image generation", {
        testId,
        slideId: slide.id,
        order: slide.order,
      });

      return {
        testId,
        slideOrder,
        completed: 1,
        failed: 0,
      };
    } catch (error) {
      const message = sanitizeErrorMessage(error);
      const errorDetails = extractErrorDetails(error);

      await supabaseAdmin
        .from("test_slide")
        .update({
          generation_status: "failed",
          generation_error: message,
        })
        .eq("id", slide.id)
        .eq("test_id", testId)
        .throwOnError();

      logger.log("Slide generation failed", {
        testId,
        slideId: slide.id,
        order: slide.order,
        message,
        promptLength: slide.image_prompt.length,
        promptPreview: safePromptPreview(slide.image_prompt),
        copyLength: slide.copy.length,
        copyPreview: safePromptPreview(slide.copy),
        errorDetails,
      });

      return {
        testId,
        slideOrder,
        completed: 0,
        failed: 1,
      };
    }
  },
});
