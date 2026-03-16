"use server";

import { saveTestResultSchema } from "@/features/tests/schema";
import { publicActionClient } from "@/lib/actions";
import { testCompletionAnalysisTask } from "@/trigger/test-completion-analysis";
import { runs } from "@trigger.dev/sdk/v3";
import { z } from "zod";

type TestAnalysisStatus = "processing" | "completed" | "failed";

const toneHints = {
  fun: "Tono leggero e brillante.",
  educational: "Tono divulgativo e informativo.",
  serious: "Tono serio e riflessivo.",
  professional: "Tono professionale e concreto.",
} as const;

const testAnalysisPollingStatusSchema = z.enum([
  "processing",
  "completed",
  "failed",
]);

const testAnalysisPollingResultSchema = z.object({
  status: testAnalysisPollingStatusSchema,
  analysisText: z.string().nullable(),
});

const getTestAnalysisStatusSchema = z.object({
  runId: z.string().trim().min(1),
});

const TERMINAL_FAILURE_STATUSES = new Set([
  "CANCELED",
  "FAILED",
  "CRASHED",
  "SYSTEM_FAILURE",
  "EXPIRED",
  "TIMED_OUT",
]);

export const saveTestResultAction = publicActionClient
  .inputSchema(saveTestResultSchema)
  .action(async ({ parsedInput, ctx }) => {
    const client = ctx.supabase;

    const { data: test, error: testError } = await client
      .from("test")
      .select("id, name, language, tone, result_type")
      .eq("id", parsedInput.testId)
      .eq("status", "published")
      .eq("is_published", true)
      .maybeSingle();

    if (testError) {
      throw testError;
    }

    if (!test) {
      throw new Error("Test not found");
    }

    const { data: profile, error: profileError } = await client
      .from("test_profile")
      .select("id")
      .eq("id", parsedInput.profileId)
      .eq("test_id", parsedInput.testId)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      throw new Error("Profile not found");
    }

    let mappedAnswers: Array<{
      order: number;
      question: string;
      response: string;
    }> = [];
    let analysisInstructions: string | null = null;

    if (test.result_type === "analysis") {
      const { data: questions, error: questionsError } = await client
        .from("test_question")
        .select("id, order, question, answers")
        .eq("test_id", parsedInput.testId)
        .order("order", { ascending: true });

      if (questionsError) {
        throw questionsError;
      }

      const questionsById = new Map(
        (questions ?? []).map((question) => [question.id, question]),
      );

      mappedAnswers = parsedInput.answerSelections
        .map((selection, index) => {
          const question = questionsById.get(selection.questionId);
          if (!question) {
            return null;
          }

          const answers = Array.isArray(question.answers)
            ? question.answers
            : [];
          const selectedAnswer = answers.find(
            (answer) =>
              answer &&
              typeof answer === "object" &&
              (answer as { order?: unknown }).order === selection.answerOrder,
          ) as { answer?: unknown } | undefined;

          return {
            order: index,
            question: question.question,
            response:
              typeof selectedAnswer?.answer === "string"
                ? selectedAnswer.answer
                : `Opzione ${selection.answerOrder + 1}`,
          };
        })
        .filter((answer): answer is { order: number; question: string; response: string } =>
          Boolean(answer),
        );

      analysisInstructions =
        "Fornisci un'analisi generale e sintetica delle risposte date al test. " +
        toneHints[test.tone];
    }

    const { data, error } = (await client
      .from("test_result")
      .insert({
        test_id: parsedInput.testId,
        profile_id: parsedInput.profileId,
        language: parsedInput.language,
        score_totals: parsedInput.scoreTotals,
        answer_selections: parsedInput.answerSelections,
      })
      .select("id")
      .single()) as {
      data: { id: string } | null;
      error: { message: string } | null;
    };

    if (error || !data) {
      throw error ?? new Error("Result not saved");
    }

    let analysisRunId: string | null = null;
    let analysisStatus: TestAnalysisStatus | null = null;

    if (test.result_type === "analysis") {
      if (mappedAnswers.length === 0 || !analysisInstructions) {
        analysisStatus = "completed";
      } else {
        try {
          const handle = await testCompletionAnalysisTask.trigger({
            testId: test.id,
            testResultId: data.id,
            language: test.language,
            testName: test.name,
            analysisInstructions,
            answers: mappedAnswers,
          });
          analysisRunId = handle.id;
          analysisStatus = "processing";
        } catch (enqueueError) {
          console.log("[enqueue_test_completion_analysis_failed]", {
            testId: test.id,
            testResultId: data.id,
            message:
              enqueueError instanceof Error
                ? enqueueError.message
                : String(enqueueError),
          });
          analysisStatus = "failed";
        }
      }
    }

    return {
      id: data.id,
      analysisRunId,
      analysisStatus,
    };
  });

export const getTestAnalysisStatusAction = publicActionClient
  .inputSchema(getTestAnalysisStatusSchema)
  .action(async ({ parsedInput }) => {
    try {
      const run = await runs.retrieve(parsedInput.runId);

      if (run.status === "COMPLETED") {
        const output = run.output as
          | { analysisText?: unknown; status?: unknown }
          | undefined;
        const analysisText =
          typeof output?.analysisText === "string"
            ? output.analysisText.trim() || null
            : null;
        const status: TestAnalysisStatus =
          output?.status === "failed" ? "failed" : "completed";

        return testAnalysisPollingResultSchema.parse({
          status,
          analysisText,
        });
      }

      if (TERMINAL_FAILURE_STATUSES.has(run.status)) {
        return testAnalysisPollingResultSchema.parse({
          status: "failed",
          analysisText: null,
        });
      }

      return testAnalysisPollingResultSchema.parse({
        status: "processing",
        analysisText: null,
      });
    } catch (error) {
      console.log("[get_test_analysis_status_failed]", {
        runId: parsedInput.runId,
        message: error instanceof Error ? error.message : String(error),
      });

      return testAnalysisPollingResultSchema.parse({
        // runs.retrieve can fail transiently (eventual consistency/network hiccups):
        // keep polling instead of failing analysis immediately.
        status: "processing",
        analysisText: null,
      });
    }
  });
