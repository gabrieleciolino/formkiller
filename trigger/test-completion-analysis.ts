import { formLanguageSchema } from "@/features/forms/schema";
import { generateCompletionAnalysis } from "@/lib/ai/functions";
import { logger, task } from "@trigger.dev/sdk/v3";
import { z } from "zod";

const testCompletionAnalysisPayloadSchema = z.object({
  testId: z.string().uuid(),
  testResultId: z.string().uuid(),
  language: formLanguageSchema,
  testName: z.string().trim().min(1),
  analysisInstructions: z.string().trim().min(1),
  answers: z
    .array(
      z.object({
        order: z.number().int().nonnegative(),
        question: z.string().trim().min(1),
        response: z.string().trim().min(1),
      }),
    )
    .min(1),
});

type TestCompletionAnalysisPayload = z.infer<
  typeof testCompletionAnalysisPayloadSchema
>;

export const testCompletionAnalysisTask = task({
  id: "test-completion-analysis",
  run: async (payload: TestCompletionAnalysisPayload) => {
    const parsedPayload = testCompletionAnalysisPayloadSchema.parse(payload);
    const {
      testId,
      testResultId,
      language,
      testName,
      analysisInstructions,
      answers,
    } = parsedPayload;

    logger.log("Starting test completion analysis", {
      testId,
      testResultId,
      answersCount: answers.length,
    });

    try {
      const analysisText = await generateCompletionAnalysis({
        language,
        formName: testName,
        analysisInstructions,
        answers,
      });
      const normalizedText = analysisText.trim();

      logger.log("Completed test completion analysis", {
        testId,
        testResultId,
        hasText: normalizedText.length > 0,
      });

      return {
        testId,
        testResultId,
        status: "completed" as const,
        analysisText: normalizedText.length > 0 ? normalizedText : null,
      };
    } catch (analysisError) {
      logger.log("Failed test completion analysis", {
        testId,
        testResultId,
        message:
          analysisError instanceof Error
            ? analysisError.message
            : String(analysisError),
      });

      return {
        testId,
        testResultId,
        status: "failed" as const,
        analysisText: null,
      };
    }
  },
});
