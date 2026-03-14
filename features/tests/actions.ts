"use server";

import {
  createTestSchema,
  deleteTestSchema,
  editTestCustomizationSchema,
  generateTestCarouselDraftSchema,
  generateTestDraftSchema,
  saveTestCarouselDraftSchema,
  TEST_CAROUSEL_SLIDE_DEFINITIONS,
  TEST_ANSWERS_PER_QUESTION,
  TEST_PROFILES_COUNT,
  triggerTestCarouselGenerationSchema,
  updateTestSchema,
  type EditableTestSlideType,
  type EditableTestType,
} from "@/features/tests/schema";
import type { FormLanguage } from "@/features/forms/schema";
import { adminActionClient } from "@/lib/actions";
import {
  generateTestCarouselDraft,
  generateViralTest,
} from "@/lib/ai/functions";
import type { TablesInsert } from "@/lib/db/supabase.types";
import { generateTTS } from "@/lib/elevenlabs/functions";
import { deleteFile } from "@/lib/r2/functions";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { testCarouselGenerationTask } from "@/trigger/test-carousel-generation";
import { urls } from "@/lib/urls";
import { revalidatePath } from "next/cache";
import { inspect } from "node:util";

const DEFAULT_TEST_BACKGROUND_ASSET_ID = "b0e66024-24c6-482a-b857-ffdb1a121c03";

const toNullableText = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

async function resolveDefaultTestBackgroundImageKey(
  client: TypedSupabaseClient,
) {
  const { data, error } = await client
    .from("asset")
    .select("file_key")
    .eq("id", DEFAULT_TEST_BACKGROUND_ASSET_ID)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const fileKey =
    data && typeof data.file_key === "string" ? data.file_key : null;

  if (!fileKey) {
    throw new Error(
      `Default test background asset not found: ${DEFAULT_TEST_BACKGROUND_ASSET_ID}`,
    );
  }

  return fileKey;
}

function logTestsActionError(
  action: string,
  error: unknown,
  metadata?: Record<string, unknown>,
) {
  if (error instanceof Error) {
    const candidate = error as Error & {
      cause?: unknown;
      statusCode?: number;
      code?: string;
      details?: unknown;
      responseBody?: unknown;
      requestBodyValues?: unknown;
      responseHeaders?: unknown;
    };

    console.error("[tests_action_error]", {
      action,
      ...metadata,
      name: candidate.name,
      message: candidate.message,
      stack: candidate.stack,
      statusCode: candidate.statusCode,
      code: candidate.code,
      details: candidate.details,
      responseBody: candidate.responseBody,
      requestBodyValues: candidate.requestBodyValues,
      responseHeaders: candidate.responseHeaders,
      cause:
        candidate.cause instanceof Error
          ? {
              name: candidate.cause.name,
              message: candidate.cause.message,
              stack: candidate.cause.stack,
            }
          : candidate.cause,
    });

    return;
  }

  let jsonValue: unknown = null;
  try {
    jsonValue = JSON.parse(JSON.stringify(error));
  } catch {
    jsonValue = null;
  }

  console.error("[tests_action_error]", {
    action,
    ...metadata,
    value: String(error),
    inspected: inspect(error, { depth: 6, breakLength: 120 }),
    jsonValue,
  });
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };

    const parts: string[] = [];
    if (typeof candidate.message === "string" && candidate.message.length > 0) {
      parts.push(candidate.message);
    }
    if (typeof candidate.code === "string" && candidate.code.length > 0) {
      parts.push(`code=${candidate.code}`);
    }
    if (typeof candidate.details === "string" && candidate.details.length > 0) {
      parts.push(`details=${candidate.details}`);
    }
    if (typeof candidate.hint === "string" && candidate.hint.length > 0) {
      parts.push(`hint=${candidate.hint}`);
    }

    if (parts.length > 0) {
      return parts.join(" | ");
    }
  }

  const asString = String(error);
  if (asString && asString !== "[object Object]") {
    return asString;
  }

  return fallback;
}

function asError(error: unknown, context: string) {
  if (error instanceof Error) {
    return error;
  }

  const message = toErrorMessage(error, context);
  return new Error(`${context}: ${message}`);
}

const slugify = (value: string) => {
  const base = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 72);

  return base.length > 0 ? base : "test";
};

async function createUniqueTestSlug({
  client,
  source,
}: {
  client: TypedSupabaseClient;
  source: string;
}) {
  const base = slugify(source);
  let slug = base;
  let suffix = 2;

  while (true) {
    const { data, error } = await client
      .from("test")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return slug;
    }

    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

function compactToken(value: string, maxChars = 36) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxChars);
}

async function buildExistingTestsDigest({
  client,
  language,
}: {
  client: TypedSupabaseClient;
  language: FormLanguage;
}) {
  const { data, error } = await client
    .from("test")
    .select(
      "name, slug, language, questions:test_question(question, order), profiles:test_profile(title, order)",
    )
    .eq("language", language)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return "Nessuno";
  }

  const lines: string[] = [];

  for (const row of data) {
    const questionsRaw = Array.isArray(row.questions)
      ? row.questions
      : [];
    const profilesRaw = Array.isArray(row.profiles)
      ? row.profiles
      : [];

    const questionTokens = questionsRaw
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .slice(0, 2)
      .map((question) => compactToken(question.question ?? "", 26))
      .filter(Boolean)
      .join("/");

    const profileTokens = profilesRaw
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .slice(0, 2)
      .map((profile) => compactToken(profile.title ?? "", 18))
      .filter(Boolean)
      .join("/");

    lines.push(
      `${compactToken(row.slug ?? "", 18)}|${compactToken(row.name ?? "", 34)}|Q:${questionTokens || "-"}|P:${profileTokens || "-"}`,
    );
  }

  return lines.join("\n").slice(0, 2400);
}

function toScoresTuple(scores: number[]): [number, number, number, number] {
  const sanitized = scores
    .slice(0, TEST_PROFILES_COUNT)
    .map((value) => Math.max(0, Math.trunc(value)));

  while (sanitized.length < TEST_PROFILES_COUNT) {
    sanitized.push(0);
  }

  return [
    sanitized[0] ?? 0,
    sanitized[1] ?? 0,
    sanitized[2] ?? 0,
    sanitized[3] ?? 0,
  ];
}

function normalizeEditableDraft(input: {
  name: string;
  introTitle: string;
  introMessage: string;
  endTitle: string;
  endMessage: string;
  profiles: Array<{ title: string; description: string; order: number }>;
  questions: Array<{
    question: string;
    order: number;
    answers: Array<{
      answer: string;
      order: number;
      scores: number[];
    }>;
  }>;
}): EditableTestType {
  return {
    name: input.name,
    language: "it",
    isPublished: false,
    introTitle: input.introTitle,
    introMessage: input.introMessage,
    endTitle: input.endTitle,
    endMessage: input.endMessage,
    profiles: input.profiles
      .slice()
      .sort((a, b) => a.order - b.order)
      .slice(0, TEST_PROFILES_COUNT)
      .map((profile, index) => ({
        id: crypto.randomUUID(),
        order: index,
        title: profile.title,
        description: profile.description,
      })),
    questions: input.questions
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((question, questionIndex) => ({
        id: crypto.randomUUID(),
        order: questionIndex,
        question: question.question,
        answers: question.answers
          .slice()
          .sort((a, b) => a.order - b.order)
          .slice(0, TEST_ANSWERS_PER_QUESTION)
          .map((answer, answerIndex) => ({
            answer: answer.answer,
            order: answerIndex,
            scores: toScoresTuple(answer.scores),
          })),
      })),
  };
}

type StoredTestSlideRow = {
  order: number;
  copy: string;
  image_prompt: string;
  image_file_key: string | null;
  generation_status: "idle" | "processing" | "completed" | "failed";
  generation_error: string | null;
};

const expectedSlideKindByOrder = Object.fromEntries(
  TEST_CAROUSEL_SLIDE_DEFINITIONS.map((slide) => [slide.order, slide.kind]),
) as Record<number, (typeof TEST_CAROUSEL_SLIDE_DEFINITIONS)[number]["kind"]>;

const normalizeCarouselSlides = (
  inputSlides: Array<
    Pick<EditableTestSlideType, "order" | "kind" | "copy" | "imagePrompt">
  >,
): EditableTestSlideType[] => {
  const byOrder = new Map(
    inputSlides.map((slide) => [slide.order, slide] as const),
  );

  return TEST_CAROUSEL_SLIDE_DEFINITIONS.map(({ order, kind }) => {
    const slide = byOrder.get(order);

    return {
      order,
      kind,
      copy: slide?.copy?.trim() ?? "",
      imagePrompt: slide?.imagePrompt?.trim() ?? "",
      imageFileKey: null,
      generationStatus: "idle",
      generationError: null,
    };
  });
};

const normalizeStoredCarouselSlides = (
  rows: StoredTestSlideRow[],
): EditableTestSlideType[] => {
  const byOrder = new Map(
    rows.map((row) => [row.order, row] as const),
  );

  return TEST_CAROUSEL_SLIDE_DEFINITIONS.map(({ order, kind }) => {
    const row = byOrder.get(order);

    return {
      order,
      kind: expectedSlideKindByOrder[order] ?? kind,
      copy: row?.copy ?? "",
      imagePrompt: row?.image_prompt ?? "",
      imageFileKey: row?.image_file_key ?? null,
      generationStatus: row?.generation_status ?? "idle",
      generationError: row?.generation_error ?? null,
    };
  });
};

async function listTestSlideImageKeys({
  client,
  testId,
}: {
  client: TypedSupabaseClient;
  testId: string;
}) {
  const { data, error } = await client
    .from("test_slide")
    .select("image_file_key")
    .eq("test_id", testId);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => row.image_file_key)
    .filter((key): key is string => Boolean(key));
}

async function upsertCarouselSlides({
  client,
  testId,
  slides,
}: {
  client: TypedSupabaseClient;
  testId: string;
  slides: EditableTestSlideType[];
}) {
  const previousImageKeys = await listTestSlideImageKeys({ client, testId });
  const upsertPayload: TablesInsert<"test_slide">[] = slides.map((slide) => ({
    test_id: testId,
    order: slide.order,
    kind: slide.kind,
    copy: slide.copy.trim(),
    image_prompt: slide.imagePrompt.trim(),
    image_file_key: null,
    generation_status: "idle",
    generation_error: null,
  }));

  const { error: upsertError } = await client
    .from("test_slide")
    .upsert(upsertPayload, {
      onConflict: "test_id,order",
    });

  if (upsertError) {
    throw upsertError;
  }

  if (previousImageKeys.length > 0) {
    await Promise.allSettled(previousImageKeys.map((key) => deleteFile(key)));
  }

  const { data: storedSlides, error: storedSlidesError } = await client
    .from("test_slide")
    .select(
      "order, copy, image_prompt, image_file_key, generation_status, generation_error",
    )
    .eq("test_id", testId)
    .order("order", { ascending: true });

  if (storedSlidesError) {
    throw storedSlidesError;
  }

  return normalizeStoredCarouselSlides(
    (storedSlides ?? []) as StoredTestSlideRow[],
  );
}

export const generateTestDraftAction = adminActionClient
  .inputSchema(generateTestDraftSchema)
  .action(async ({ parsedInput, ctx }) => {
    const existingTestsDigest = await buildExistingTestsDigest({
      client: ctx.supabase,
      language: parsedInput.language,
    });

    const output = await generateViralTest({
      additionalPrompt: parsedInput.additionalPrompt,
      existingTestsDigest,
      language: parsedInput.language,
      questionsCount: parsedInput.questionsCount,
    });

    const normalized = normalizeEditableDraft(output);

    return {
      ...normalized,
      language: parsedInput.language,
    };
  });

export const createTestAction = adminActionClient
  .inputSchema(createTestSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;
    const client = supabase;
    const generatedTtsKeys: string[] = [];
    let createdTestId: string | null = null;

    try {
      const slug = await createUniqueTestSlug({
        client,
        source: parsedInput.name,
      });
      const defaultBackgroundImageKey =
        await resolveDefaultTestBackgroundImageKey(client);

      const { data: createdTest, error: createTestError } = (await client
        .from("test")
        .insert({
          user_id: userId,
          name: parsedInput.name,
          slug,
          language: parsedInput.language,
          status: parsedInput.isPublished ? "published" : "draft",
          is_published: parsedInput.isPublished,
          background_image_key: defaultBackgroundImageKey,
          intro_title: toNullableText(parsedInput.introTitle),
          intro_message: toNullableText(parsedInput.introMessage),
          end_title: toNullableText(parsedInput.endTitle),
          end_message: toNullableText(parsedInput.endMessage),
        })
        .select("id, slug")
        .single()) as {
        data: { id: string; slug: string } | null;
        error: { message: string } | null;
      };

      if (createTestError || !createdTest) {
        throw createTestError ?? new Error("Test not created");
      }

      createdTestId = createdTest.id;

      const { error: profilesError } = await client.from("test_profile").insert(
        parsedInput.profiles.map((profile, index) => ({
          test_id: createdTest.id,
          order: index,
          title: profile.title,
          description: profile.description,
        })),
      );

      if (profilesError) {
        throw profilesError;
      }

      const { data: insertedQuestions, error: questionsError } = await client
        .from("test_question")
        .insert(
          parsedInput.questions.map((question, questionIndex) => ({
            test_id: createdTest.id,
            order: questionIndex,
            question: question.question,
            answers: question.answers.map((answer, answerIndex) => ({
              answer: answer.answer,
              order: answerIndex,
              scores: answer.scores,
            })),
          })),
        )
        .select("id, question") as {
        data: Array<{ id: string; question: string }> | null;
        error: { message: string } | null;
      };

      if (questionsError || !insertedQuestions) {
        throw questionsError ?? new Error("Questions not created");
      }

      const ttsResults = await Promise.all(
        insertedQuestions.map((question) =>
          generateTTS({
            text: question.question,
            formId: createdTest.id,
            language: parsedInput.language,
          }),
        ),
      );

      generatedTtsKeys.push(...ttsResults.map((result) => result.key));

      await Promise.all(
        insertedQuestions.map((question, index) =>
          client
            .from("test_question")
            .update({
              file_key: ttsResults[index].key,
              file_generated_at: new Date().toISOString(),
            })
            .eq("id", question.id)
            .eq("test_id", createdTest.id),
        ),
      );

      revalidatePath(urls.admin.tests.index);
      revalidatePath(urls.admin.tests.detail(createdTest.id));
      revalidatePath(urls.test(createdTest.slug));

      return {
        id: createdTest.id,
        slug: createdTest.slug,
      };
    } catch (error) {
      if (createdTestId) {
        await client.from("test").delete().eq("id", createdTestId);
      }

      if (generatedTtsKeys.length > 0) {
        await Promise.allSettled(generatedTtsKeys.map((key) => deleteFile(key)));
      }

      throw error;
    }
  });

export const updateTestAction = adminActionClient
  .inputSchema(updateTestSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const client = supabase;

    const { data: currentTest, error: currentTestError } = (await client
      .from("test")
      .select("id, slug")
      .eq("id", parsedInput.testId)
      .single()) as {
      data: { id: string; slug: string } | null;
      error: { message: string } | null;
    };

    if (currentTestError || !currentTest) {
      throw currentTestError ?? new Error("Test not found");
    }

    const { data: currentQuestions, error: currentQuestionsError } = (await client
      .from("test_question")
      .select("file_key")
      .eq("test_id", parsedInput.testId)) as {
      data: Array<{ file_key: string | null }> | null;
      error: { message: string } | null;
    };

    if (currentQuestionsError) {
      throw currentQuestionsError;
    }

    const oldAudioKeys = (currentQuestions ?? [])
      .map((question) => question.file_key)
      .filter((key): key is string => Boolean(key));
    const defaultBackgroundImageKey =
      await resolveDefaultTestBackgroundImageKey(client);

    const { error: updateTestError } = await client
      .from("test")
      .update({
        name: parsedInput.name,
        language: parsedInput.language,
        status: parsedInput.isPublished ? "published" : "draft",
        is_published: parsedInput.isPublished,
        background_image_key: defaultBackgroundImageKey,
        intro_title: toNullableText(parsedInput.introTitle),
        intro_message: toNullableText(parsedInput.introMessage),
        end_title: toNullableText(parsedInput.endTitle),
        end_message: toNullableText(parsedInput.endMessage),
      })
      .eq("id", parsedInput.testId);

    if (updateTestError) {
      throw updateTestError;
    }

    await client.from("test_profile").delete().eq("test_id", parsedInput.testId);
    await client.from("test_question").delete().eq("test_id", parsedInput.testId);

    const { error: profilesError } = await client.from("test_profile").insert(
      parsedInput.profiles.map((profile, index) => ({
        test_id: parsedInput.testId,
        order: index,
        title: profile.title,
        description: profile.description,
      })),
    );

    if (profilesError) {
      throw profilesError;
    }

    const { data: insertedQuestions, error: questionsError } = await client
      .from("test_question")
      .insert(
        parsedInput.questions.map((question, questionIndex) => ({
          test_id: parsedInput.testId,
          order: questionIndex,
          question: question.question,
          answers: question.answers.map((answer, answerIndex) => ({
            answer: answer.answer,
            order: answerIndex,
            scores: answer.scores,
          })),
        })),
      )
      .select("id, question") as {
      data: Array<{ id: string; question: string }> | null;
      error: { message: string } | null;
    };

    if (questionsError || !insertedQuestions) {
      throw questionsError ?? new Error("Questions not created");
    }

    const ttsResults = await Promise.all(
      insertedQuestions.map((question) =>
        generateTTS({
          text: question.question,
          formId: parsedInput.testId,
          language: parsedInput.language,
        }),
      ),
    );

    await Promise.all(
      insertedQuestions.map((question, index) =>
        client
          .from("test_question")
          .update({
            file_key: ttsResults[index].key,
            file_generated_at: new Date().toISOString(),
          })
          .eq("id", question.id)
          .eq("test_id", parsedInput.testId),
      ),
    );

    await Promise.allSettled(oldAudioKeys.map((key) => deleteFile(key)));

    revalidatePath(urls.admin.tests.index);
    revalidatePath(urls.admin.tests.detail(parsedInput.testId));
    revalidatePath(urls.test(currentTest.slug));

    return {
      id: parsedInput.testId,
      slug: currentTest.slug,
    };
  });

export const editTestCustomizationAction = adminActionClient
  .inputSchema(editTestCustomizationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const client = supabase;
    const defaultBackgroundImageKey =
      await resolveDefaultTestBackgroundImageKey(client);

    const { data: updatedTest, error: updateTestError } = (await client
      .from("test")
      .update({
        background_image_key: defaultBackgroundImageKey,
        background_music_key: parsedInput.backgroundMusicKey ?? null,
      })
      .eq("id", parsedInput.testId)
      .select("id, slug")
      .single()) as {
      data: { id: string; slug: string } | null;
      error: { message: string } | null;
    };

    if (updateTestError || !updatedTest) {
      throw updateTestError ?? new Error("Test not found");
    }

    revalidatePath(urls.admin.tests.index);
    revalidatePath(urls.admin.tests.detail(parsedInput.testId));
    revalidatePath(urls.test(updatedTest.slug));

    return {
      id: updatedTest.id,
      slug: updatedTest.slug,
    };
  });

export const deleteTestAction = adminActionClient
  .inputSchema(deleteTestSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const client = supabase;

    const { data: currentTest, error: currentTestError } = (await client
      .from("test")
      .select("slug")
      .eq("id", parsedInput.testId)
      .single()) as {
      data: { slug: string } | null;
      error: { message: string } | null;
    };

    if (currentTestError || !currentTest) {
      throw currentTestError ?? new Error("Test not found");
    }

    const { data: currentQuestions } = (await client
      .from("test_question")
      .select("file_key")
      .eq("test_id", parsedInput.testId)) as {
      data: Array<{ file_key: string | null }> | null;
      error: { message: string } | null;
    };

    const audioKeys = (currentQuestions ?? [])
      .map((question) => question.file_key)
      .filter((key): key is string => Boolean(key));

    const { error: deleteError } = await client
      .from("test")
      .delete()
      .eq("id", parsedInput.testId);

    if (deleteError) {
      throw deleteError;
    }

    await Promise.allSettled(audioKeys.map((key) => deleteFile(key)));

    revalidatePath(urls.admin.tests.index);
    revalidatePath(urls.test(currentTest.slug));
  });

export const generateTestCarouselDraftAction = adminActionClient
  .inputSchema(generateTestCarouselDraftSchema)
  .action(async ({ parsedInput, ctx }) => {
    const client = ctx.supabase;

    const { data: test, error: testError } = await client
      .from("test")
      .select(
        "id, name, language, intro_title, intro_message, end_title, end_message",
      )
      .eq("id", parsedInput.testId)
      .maybeSingle();

    if (testError) {
      throw testError;
    }

    if (!test) {
      throw new Error("Test not found");
    }

    const { data: questions, error: questionsError } = await client
      .from("test_question")
      .select("order, question, answers")
      .eq("test_id", parsedInput.testId)
      .order("order", { ascending: true })
      .limit(2);

    if (questionsError) {
      throw questionsError;
    }

    const normalizedQuestions = (questions ?? []).map((question) => {
      const answers = Array.isArray(question.answers)
        ? question.answers
            .filter(
              (answer): answer is { answer: string; order: number } =>
                Boolean(answer) &&
                typeof answer === "object" &&
                typeof (answer as { answer?: unknown }).answer === "string" &&
                typeof (answer as { order?: unknown }).order === "number",
            )
            .sort((a, b) => a.order - b.order)
            .slice(0, TEST_ANSWERS_PER_QUESTION)
        : [];

      return {
        order: question.order ?? 0,
        question: question.question ?? "",
        answers,
      };
    });

    if (normalizedQuestions.length < 2) {
      throw new Error("At least two questions are required");
    }

    const draftSlides = await generateTestCarouselDraft({
      language: test.language,
      testName: test.name,
      introTitle: test.intro_title ?? test.name,
      introMessage: test.intro_message ?? "",
      endTitle: test.end_title ?? "",
      endMessage: test.end_message ?? "",
      questions: normalizedQuestions,
    });

    const normalizedSlides = normalizeCarouselSlides(draftSlides);
    const storedSlides = await upsertCarouselSlides({
      client,
      testId: parsedInput.testId,
      slides: normalizedSlides,
    });

    revalidatePath(urls.admin.slides.index);
    revalidatePath(urls.admin.slides.detail(parsedInput.testId));

    return {
      slides: storedSlides,
    };
  });

export const saveTestCarouselDraftAction = adminActionClient
  .inputSchema(saveTestCarouselDraftSchema)
  .action(async ({ parsedInput, ctx }) => {
    const client = ctx.supabase;
    const normalizedSlides = normalizeCarouselSlides(parsedInput.slides);

    if (normalizedSlides.some((slide) => slide.copy.trim().length === 0)) {
      throw new Error("Slide copy is required");
    }

    if (
      normalizedSlides.some((slide) => slide.imagePrompt.trim().length === 0)
    ) {
      throw new Error("Slide image prompt is required");
    }

    const storedSlides = await upsertCarouselSlides({
      client,
      testId: parsedInput.testId,
      slides: normalizedSlides,
    });

    revalidatePath(urls.admin.slides.index);
    revalidatePath(urls.admin.slides.detail(parsedInput.testId));

    return {
      slides: storedSlides,
    };
  });

export const triggerTestCarouselGenerationAction = adminActionClient
  .inputSchema(triggerTestCarouselGenerationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const client = ctx.supabase;
    const slideDefinition = TEST_CAROUSEL_SLIDE_DEFINITIONS.find(
      (slide) => slide.order === parsedInput.slideOrder,
    );
    let step = "init";
    try {
      step = "find-slide-definition";
      if (!slideDefinition) {
        throw new Error("Slide configuration not found");
      }

      step = "upsert-slide";
      const { error: upsertSlideError } = await client.from("test_slide").upsert(
        {
          test_id: parsedInput.testId,
          order: parsedInput.slideOrder,
          kind: slideDefinition.kind,
          copy: parsedInput.copy.trim(),
          image_prompt: parsedInput.imagePrompt.trim(),
          generation_error: null,
        },
        {
          onConflict: "test_id,order",
        },
      );

      if (upsertSlideError) {
        throw asError(
          upsertSlideError,
          "Upsert test_slide failed in triggerTestCarouselGenerationAction",
        );
      }

      if (parsedInput.slideOrder > 0) {
        step = "load-first-slide";
        const { data: firstSlide, error: firstSlideError } = await client
          .from("test_slide")
          .select("image_file_key")
          .eq("test_id", parsedInput.testId)
          .eq("kind", "intro")
          .maybeSingle();

        if (firstSlideError) {
          throw asError(
            firstSlideError,
            "Load slide 1 failed in triggerTestCarouselGenerationAction",
          );
        }

        if (!firstSlide?.image_file_key) {
          throw new Error("Generate slide 1 image before generating this slide");
        }
      }

      step = "mark-processing";
      const { error: markProcessingError } = await client
        .from("test_slide")
        .update({
          generation_status: "processing",
          generation_error: null,
        })
        .eq("test_id", parsedInput.testId)
        .eq("kind", slideDefinition.kind);

      if (markProcessingError) {
        throw asError(
          markProcessingError,
          "Mark slide as processing failed in triggerTestCarouselGenerationAction",
        );
      }

      step = "enqueue-trigger-task";
      await testCarouselGenerationTask.trigger({
        testId: parsedInput.testId,
        slideOrder: parsedInput.slideOrder,
      });

      step = "revalidate-paths";
      revalidatePath(urls.admin.slides.index);
      revalidatePath(urls.admin.slides.detail(parsedInput.testId));

      return {
        queued: true,
        slideOrder: parsedInput.slideOrder,
      };
    } catch (error) {
      const failedStep = step;
      const normalizedError = asError(
        error,
        `triggerTestCarouselGenerationAction failed at step=${step}`,
      );

      step = "mark-failed";
      await client
        .from("test_slide")
        .update({
          generation_status: "failed",
          generation_error:
            normalizedError instanceof Error
              ? normalizedError.message.slice(0, 600)
              : "Trigger enqueue failed",
        })
        .eq("test_id", parsedInput.testId)
        .eq("kind", slideDefinition?.kind ?? "intro");

      logTestsActionError("triggerTestCarouselGenerationAction", normalizedError, {
        testId: parsedInput.testId,
        slideOrder: parsedInput.slideOrder,
        copyLength: parsedInput.copy.length,
        promptLength: parsedInput.imagePrompt.length,
        step: failedStep,
      });

      throw normalizedError;
    }
  });
