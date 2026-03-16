import { createFormSchema } from "@/features/forms/schema";
import { generateForm } from "@/lib/ai/functions";
import { deleteFile } from "@/lib/r2/functions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  generateTTS,
  getDefaultElevenLabsVoiceId,
} from "@/lib/elevenlabs/functions";
import { logger, task } from "@trigger.dev/sdk/v3";
import { z } from "zod";

const formCreatePayloadSchema = createFormSchema.extend({
  userId: z.string().uuid(),
});

type FormCreatePayload = z.infer<typeof formCreatePayloadSchema>;

const toNullableText = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const formCreateTask = task({
  id: "form-create",
  run: async (payload: FormCreatePayload) => {
    const parsedPayload = formCreatePayloadSchema.parse(payload);
    const { userId, name, instructions, type, language, voiceId, questions = [] } =
      parsedPayload;
    const normalizedInstructions = instructions.trim();
    const normalizedVoiceId = voiceId?.trim() || null;
    const fallbackVoiceId = getDefaultElevenLabsVoiceId();
    const resolvedVoiceId = normalizedVoiceId ?? fallbackVoiceId;
    const generatedTtsKeys: string[] = [];
    let createdFormId: string | null = null;

    logger.log("Starting form create task", {
      userId,
      language,
      hasManualQuestions: questions.length > 0,
      questionsCount: questions.length,
    });

    try {
      const hasManualQuestions = questions.length > 0;
      let introTitle: string | null = null;
      let introMessage: string | null = null;
      let endTitle: string | null = null;
      let endMessage: string | null = null;

      const questionsToInsert: Array<{
        question: string;
        order: number;
        defaultAnswers: Array<{ answer: string; order: number }>;
      }> = hasManualQuestions
        ? questions.map((question) => ({
            question: question.question,
            order: question.order,
            defaultAnswers: question.default_answers,
          }))
        : [];

      if (!hasManualQuestions) {
        const output = await generateForm({
          instructions: normalizedInstructions,
          language,
        });

        if (!output || output.questions.length === 0) {
          throw new Error("Empty AI output.");
        }

        questionsToInsert.push(...output.questions);
        introTitle = toNullableText(output.introTitle);
        introMessage = toNullableText(output.introMessage);
        endTitle = toNullableText(output.endTitle);
        endMessage = toNullableText(output.endMessage);
      }

      const { data: form, error } = await supabaseAdmin
        .from("form")
        .insert({
          name,
          instructions: normalizedInstructions,
          type,
          language,
          voice_id: resolvedVoiceId,
          user_id: userId,
          intro_title: introTitle,
          intro_message: introMessage,
          end_title: endTitle,
          end_message: endMessage,
        })
        .select("id")
        .single();

      if (error || !form) {
        throw error ?? new Error("Form not created");
      }

      createdFormId = form.id;

      const insertedQuestions = await Promise.all(
        questionsToInsert.map(async (question) => {
          const { data, error: insertError } = await supabaseAdmin
            .from("question")
            .insert({
              question: question.question,
              order: question.order,
              default_answers: question.defaultAnswers,
              form_id: form.id,
              user_id: userId,
            })
            .select("id, question")
            .single();

          if (insertError || !data) {
            throw insertError ?? new Error("Question not created");
          }

          return data;
        }),
      );

      const ttsResults = await Promise.all(
        insertedQuestions.map((question) =>
          generateTTS({
            text: question.question,
            formId: form.id,
            language,
            voiceId: resolvedVoiceId,
          }),
        ),
      );
      generatedTtsKeys.push(...ttsResults.map((result) => result.key));

      await Promise.all(
        insertedQuestions.map((question, index) =>
          supabaseAdmin
            .from("question")
            .update({
              file_key: ttsResults[index].key,
              file_generated_at: new Date().toUTCString(),
            })
            .eq("id", question.id)
            .eq("form_id", form.id)
            .throwOnError(),
        ),
      );

      logger.log("Completed form create task", {
        userId,
        formId: form.id,
        questionsCount: insertedQuestions.length,
      });

      return {
        status: "completed" as const,
        formId: form.id,
      };
    } catch (error) {
      if (createdFormId) {
        try {
          await supabaseAdmin.from("form").delete().eq("id", createdFormId).throwOnError();
        } catch (cleanupError) {
          logger.log("Failed form create cleanup", {
            formId: createdFormId,
            message:
              cleanupError instanceof Error
                ? cleanupError.message
                : String(cleanupError),
          });
        }
      }

      if (generatedTtsKeys.length > 0) {
        await Promise.allSettled(generatedTtsKeys.map((key) => deleteFile(key)));
      }

      logger.log("Failed form create task", {
        userId,
        formId: createdFormId,
        message: error instanceof Error ? error.message : String(error),
      });

      return {
        status: "failed" as const,
        formId: null,
      };
    }
  },
});
