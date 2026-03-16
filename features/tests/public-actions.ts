"use server";

import { saveTestResultSchema } from "@/features/tests/schema";
import { publicActionClient } from "@/lib/actions";
import { generateCompletionAnalysis } from "@/lib/ai/functions";

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

    let analysisText: string | null = null;

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

      const mappedAnswers = parsedInput.answerSelections
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

      const toneHints: Record<typeof test.tone, string> = {
        fun: "Tono leggero e brillante.",
        educational: "Tono divulgativo e informativo.",
        serious: "Tono serio e riflessivo.",
        professional: "Tono professionale e concreto.",
      };

      analysisText = await generateCompletionAnalysis({
        language: test.language,
        formName: test.name,
        analysisInstructions: `Fornisci un'analisi generale e sintetica delle risposte date al test. ${toneHints[test.tone]}`,
        answers: mappedAnswers,
      });
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

    return {
      id: data.id,
      analysisText,
    };
  });
