import { generateTestDraftSchema } from "@/features/tests/schema";
import { generateViralTest } from "@/lib/ai/functions";
import { logger, task } from "@trigger.dev/sdk/v3";
import { z } from "zod";

const testDraftGenerationPayloadSchema = generateTestDraftSchema.extend({
  existingTestsDigest: z.string(),
});

type TestDraftGenerationPayload = z.infer<typeof testDraftGenerationPayloadSchema>;

export const testDraftGenerationTask = task({
  id: "test-draft-generation",
  run: async (payload: TestDraftGenerationPayload) => {
    const parsedPayload = testDraftGenerationPayloadSchema.parse(payload);
    const {
      additionalPrompt,
      existingTestsDigest,
      language,
      questionsCount,
      tone,
      resultType,
    } = parsedPayload;

    logger.log("Starting test draft generation", {
      language,
      questionsCount,
      tone,
      resultType,
    });

    try {
      const draft = await generateViralTest({
        additionalPrompt,
        existingTestsDigest,
        language,
        questionsCount,
        tone,
        resultType,
      });

      logger.log("Completed test draft generation", {
        language,
        questionsCount,
        tone,
        resultType,
      });

      return {
        status: "completed" as const,
        language,
        tone,
        resultType,
        draft,
      };
    } catch (error) {
      logger.log("Failed test draft generation", {
        language,
        questionsCount,
        tone,
        resultType,
        message: error instanceof Error ? error.message : String(error),
      });

      return {
        status: "failed" as const,
        language,
        tone,
        resultType,
        draft: null,
      };
    }
  },
});
