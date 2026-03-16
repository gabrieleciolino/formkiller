"use server";

import {
  addQuestionSchema,
  assignFormUserSchema,
  createFormSchema,
  deleteFormSchema,
  deleteQuestionSchema,
  editFormSchema,
  editQuestionsSchema,
  generateAnalysisInstructionsSchema,
  getElevenLabsVoicesSchema,
  generateQuestionTTSSchema,
  saveAnalysisInstructionsSchema,
  unassignFormUserSchema,
} from "@/features/forms/schema";
import { adminActionClient } from "@/lib/actions";
import {
  generateFormAnalysisInstructions,
} from "@/lib/ai/functions";
import {
  generateTTS,
  getDefaultElevenLabsVoiceId,
  getElevenLabsVoices,
} from "@/lib/elevenlabs/functions";
import { formCreateTask } from "@/trigger/form-create";
import { urls } from "@/lib/urls";
import { revalidatePath } from "next/cache";
import { runs } from "@trigger.dev/sdk/v3";
import { z } from "zod";

const getCreateFormStatusSchema = z.object({
  runId: z.string().trim().min(1),
});

const createFormStatusResultSchema = z.object({
  status: z.enum(["processing", "completed", "failed"]),
  formId: z.string().uuid().nullable(),
});

const TERMINAL_FAILURE_STATUSES = new Set([
  "CANCELED",
  "FAILED",
  "CRASHED",
  "SYSTEM_FAILURE",
  "EXPIRED",
  "TIMED_OUT",
]);

export const createFormAction = adminActionClient
  .inputSchema(createFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const handle = await formCreateTask.trigger(
      {
        ...parsedInput,
        userId,
      },
      {
        maxAttempts: 1,
      },
    );

    return {
      runId: handle.id,
    };
  });

export const getCreateFormStatusAction = adminActionClient
  .inputSchema(getCreateFormStatusSchema)
  .action(async ({ parsedInput }) => {
    try {
      const run = await runs.retrieve(parsedInput.runId);

      if (run.taskIdentifier !== "form-create") {
        return createFormStatusResultSchema.parse({
          status: "failed",
          formId: null,
        });
      }

      if (run.status === "COMPLETED") {
        const output = run.output as
          | {
              status?: unknown;
              formId?: unknown;
            }
          | undefined;

        if (output?.status === "completed" && typeof output.formId === "string") {
          revalidatePath(urls.dashboard.forms.index);
          revalidatePath(urls.admin.forms.index);
          revalidatePath(urls.dashboard.forms.detail(output.formId));
          revalidatePath(urls.admin.forms.detail(output.formId));

          return createFormStatusResultSchema.parse({
            status: "completed",
            formId: output.formId,
          });
        }

        return createFormStatusResultSchema.parse({
          status: "failed",
          formId: null,
        });
      }

      if (TERMINAL_FAILURE_STATUSES.has(run.status)) {
        return createFormStatusResultSchema.parse({
          status: "failed",
          formId: null,
        });
      }

      return createFormStatusResultSchema.parse({
        status: "processing",
        formId: null,
      });
    } catch (error) {
      console.log("[get_create_form_status_failed]", {
        runId: parsedInput.runId,
        message: error instanceof Error ? error.message : String(error),
      });

      return createFormStatusResultSchema.parse({
        status: "failed",
        formId: null,
      });
    }
  });

export const getElevenLabsVoicesAction = adminActionClient
  .inputSchema(getElevenLabsVoicesSchema)
  .action(async () => {
    const voices = await getElevenLabsVoices();
    const defaultVoiceId = getDefaultElevenLabsVoiceId();

    return { voices, defaultVoiceId };
  });

export const editFormAction = adminActionClient
  .inputSchema(editFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const {
      formId,
      name,
      type,
      theme,
      backgroundImageKey,
      backgroundMusicKey,
      introTitle,
      introMessage,
      endTitle,
      endMessage,
    } = parsedInput;

    const toNullableText = (value: string) => {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const { data: form, error } = await supabase
      .from("form")
      .update({
        name,
        type,
        theme: theme ?? "dark",
        background_image_key: backgroundImageKey ?? null,
        background_music_key: backgroundMusicKey ?? null,
        intro_title: toNullableText(introTitle),
        intro_message: toNullableText(introMessage),
        end_title: toNullableText(endTitle),
        end_message: toNullableText(endMessage),
      })
      .eq("id", formId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    revalidatePath(urls.dashboard.forms.index);
    revalidatePath(urls.dashboard.forms.detail(formId));
    revalidatePath(urls.admin.forms.index);
    revalidatePath(urls.admin.forms.detail(formId));

    return form;
  });

export const editQuestionsAction = adminActionClient
  .inputSchema(editQuestionsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { questions, formId, language } = parsedInput;

    const ids = questions.map((question) => question.id);

    const { data: currentQuestions } = await supabase
      .from("question")
      .select("id, question")
      .in("id", ids)
      .eq("form_id", formId)
      .throwOnError();

    const currentMap = new Map(
      (currentQuestions ?? []).map((question) => [question.id, question]),
    );

    const changedQuestions = questions.filter(
      (question) => currentMap.get(question.id)?.question !== question.question,
    );

    const { data: form } = await supabase
      .from("form")
      .select("voice_id")
      .eq("id", formId)
      .single()
      .throwOnError();

    await Promise.all(
      questions.map((question) =>
        supabase
          .from("question")
          .update({
            question: question.question,
            default_answers: question.default_answers,
          })
          .eq("id", question.id)
          .eq("form_id", formId)
          .throwOnError(),
      ),
    );

    if (changedQuestions.length > 0) {
      const ttsResults = await Promise.all(
        changedQuestions.map((question) =>
          generateTTS({
            text: question.question,
            formId,
            language,
            voiceId: form.voice_id,
          }),
        ),
      );

      await Promise.all(
        changedQuestions.map((question, index) =>
          supabase
            .from("question")
            .update({
              file_key: ttsResults[index].key,
              file_generated_at: new Date().toUTCString(),
            })
            .eq("id", question.id)
            .eq("form_id", formId)
            .throwOnError(),
        ),
      );
    }

    revalidatePath(urls.dashboard.forms.detail(formId));
    revalidatePath(urls.admin.forms.detail(formId));

    return questions;
  });

export const addQuestionAction = adminActionClient
  .inputSchema(addQuestionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { formId, question, answers } = parsedInput;

    const { data: form } = await supabase
      .from("form")
      .select("user_id")
      .eq("id", formId)
      .single()
      .throwOnError();

    const { data: lastQuestion } = await supabase
      .from("question")
      .select("order")
      .eq("form_id", formId)
      .order("order", { ascending: false })
      .limit(1)
      .maybeSingle()
      .throwOnError();

    const nextOrder = (lastQuestion?.order ?? -1) + 1;

    await supabase
      .from("question")
      .insert({
        form_id: formId,
        user_id: form.user_id,
        question,
        order: nextOrder,
        default_answers: answers.map((answer, index) => ({
          answer,
          order: index,
        })),
      })
      .throwOnError();

    revalidatePath(urls.dashboard.forms.detail(formId));
    revalidatePath(urls.admin.forms.detail(formId));
  });

export const deleteQuestionAction = adminActionClient
  .inputSchema(deleteQuestionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { questionId, formId } = parsedInput;

    const { error } = await supabase
      .from("question")
      .delete()
      .eq("id", questionId)
      .eq("form_id", formId);

    if (error) throw error;

    revalidatePath(urls.dashboard.forms.detail(formId));
    revalidatePath(urls.admin.forms.detail(formId));
  });

export const deleteFormAction = adminActionClient
  .inputSchema(deleteFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { formId } = parsedInput;

    const { error } = await supabase.from("form").delete().eq("id", formId);

    if (error) throw error;

    revalidatePath(urls.dashboard.forms.index);
    revalidatePath(urls.admin.forms.index);
  });

export const generateQuestionTTSAction = adminActionClient
  .inputSchema(generateQuestionTTSSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { questionId, formId, language } = parsedInput;

    const { data: question } = await supabase
      .from("question")
      .select("question")
      .eq("id", questionId)
      .eq("form_id", formId)
      .single()
      .throwOnError();

    if (!question) throw new Error("Question not found.");

    const { data: form } = await supabase
      .from("form")
      .select("voice_id")
      .eq("id", formId)
      .single()
      .throwOnError();

    const { url, key } = await generateTTS({
      text: question.question,
      formId,
      language,
      voiceId: form.voice_id,
    });

    await supabase
      .from("question")
      .update({
        file_key: key,
        file_generated_at: new Date().toUTCString(),
      })
      .eq("id", questionId)
      .eq("form_id", formId)
      .throwOnError();

    revalidatePath(urls.dashboard.forms.detail(formId));
    revalidatePath(urls.admin.forms.detail(formId));

    return { url };
  });

export const generateFormAnalysisInstructionsAction = adminActionClient
  .inputSchema(generateAnalysisInstructionsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { formId, additionalPrompt } = parsedInput;

    const { data: form } = await supabase
      .from("form")
      .select("id, language, instructions, questions:question(question, order, default_answers)")
      .eq("id", formId)
      .order("order", { referencedTable: "question", ascending: true })
      .single()
      .throwOnError();

    const questions = form.questions as Array<{
      question: string;
      order: number;
      default_answers: Array<{ answer: string; order: number }>;
    }>;
    if (!questions || questions.length === 0) {
      throw new Error("Form has no questions.");
    }

    const normalizedQuestions = questions.map((question) => ({
      order: question.order,
      question: question.question,
      defaultAnswers: (question.default_answers as Array<{
        answer: string;
        order: number;
      }>).map((answer) => ({
        answer: answer.answer,
        order: answer.order,
      })),
    }));

    const analysisInstructions = await generateFormAnalysisInstructions({
      language: form.language,
      formInstructions: form.instructions,
      additionalPrompt,
      questions: normalizedQuestions,
    });

    return { analysisInstructions };
  });

export const saveFormAnalysisInstructionsAction = adminActionClient
  .inputSchema(saveAnalysisInstructionsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { formId, analysisInstructions } = parsedInput;

    const trimmed = analysisInstructions.trim();

    await supabase
      .from("form")
      .update({
        analysis_instructions: trimmed.length > 0 ? trimmed : null,
      })
      .eq("id", formId)
      .throwOnError();

    revalidatePath(urls.dashboard.forms.detail(formId));
    revalidatePath(urls.admin.forms.detail(formId));
    revalidatePath(urls.dashboard.forms.index);
    revalidatePath(urls.admin.forms.index);

    return { analysisInstructions: trimmed.length > 0 ? trimmed : null };
  });

export const assignUserToFormAction = adminActionClient
  .inputSchema(assignFormUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId: adminUserId } = ctx;
    const { formId, userId } = parsedInput;

    await supabase
      .from("form_assignment")
      .upsert(
        {
          form_id: formId,
          user_id: userId,
          assigned_by: adminUserId,
          active: true,
        },
        { onConflict: "form_id,user_id" },
      )
      .throwOnError();

    revalidatePath(urls.admin.forms.detail(formId));
    revalidatePath(urls.dashboard.forms.index);
  });

export const unassignUserFromFormAction = adminActionClient
  .inputSchema(unassignFormUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { formId, userId } = parsedInput;

    await supabase
      .from("form_assignment")
      .update({ active: false })
      .eq("form_id", formId)
      .eq("user_id", userId)
      .throwOnError();

    revalidatePath(urls.admin.forms.detail(formId));
    revalidatePath(urls.dashboard.forms.index);
  });
