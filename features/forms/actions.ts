"use server";

import {
  createFormSchema,
  deleteFormSchema,
  editFormSchema,
  editQuestionsSchema,
  FormLanguage,
  generateQuestionTTSSchema,
} from "@/features/forms/schema";
import { authenticatedActionClient } from "@/lib/actions";
import { generateForm } from "@/lib/ai/functions";
import { generateTTS } from "@/lib/elevenlabs/functions";
import { urls } from "@/lib/urls";
import { revalidatePath } from "next/cache";

export const createFormAction = authenticatedActionClient
  .inputSchema(createFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;
    const { name, instructions, type, language } = parsedInput;

    const { data: form, error } = await supabase
      .from("form")
      .insert({
        name,
        instructions,
        type,
        language,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const output = await generateForm({ instructions, language });

    if (!output || output.questions.length === 0) {
      throw new Error("Empty AI output.");
    }

    const insertPromises = output.questions.map((q) =>
      supabase
        .from("question")
        .insert({
          question: q.question,
          order: q.order,
          default_answers: q.defaultAnswers,
          form_id: form.id,
          user_id: userId,
        })
        .select()
        .single(),
    );

    const insertResults = await Promise.all(insertPromises);
    const insertedQuestions = insertResults.map((r) => r.data!);

    const ttsResults = await Promise.all(
      insertedQuestions.map((q) =>
        generateTTS({
          text: q.question,
          formId: form.id,
          language: form.language,
        }),
      ),
    );

    await Promise.all(
      insertedQuestions.map((q, i) =>
        supabase
          .from("question")
          .update({
            file_key: ttsResults[i].key,
            file_generated_at: new Date().toUTCString(),
          })
          .eq("id", q.id),
      ),
    );

    revalidatePath(urls.dashboard.forms.index);

    return form;
  });

export const editFormAction = authenticatedActionClient
  .inputSchema(editFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;
    const { name, instructions, formId, type, theme, backgroundImageKey, backgroundMusicKey } = parsedInput;

    const { data: form, error } = await supabase
      .from("form")
      .update({
        name,
        instructions,
        type,
        theme: theme ?? "dark",
        background_image_key: backgroundImageKey ?? null,
        background_music_key: backgroundMusicKey ?? null,
      })
      .eq("id", formId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    revalidatePath(urls.dashboard.forms.detail(formId));

    return form;
  });

export const editQuestionsAction = authenticatedActionClient
  .inputSchema(editQuestionsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;
    const { questions, formId, language } = parsedInput;

    const ids = questions.map((q) => q.id);

    const { data: currentQuestions } = await supabase
      .from("question")
      .select("id, question")
      .in("id", ids)
      .eq("user_id", userId)
      .throwOnError();

    const currentMap = new Map(currentQuestions!.map((q) => [q.id, q]));

    const changedQuestions = questions.filter(
      (q) => currentMap.get(q.id)?.question !== q.question,
    );

    await Promise.all(
      questions.map((q) =>
        supabase
          .from("question")
          .update({
            question: q.question,
            default_answers: q.default_answers,
          })
          .eq("id", q.id)
          .eq("user_id", userId)
          .throwOnError(),
      ),
    );

    if (changedQuestions.length > 0) {
      const ttsResults = await Promise.all(
        changedQuestions.map((q) =>
          generateTTS({
            text: q.question,
            formId,
            language: language as FormLanguage,
          }),
        ),
      );

      await Promise.all(
        changedQuestions.map((q, i) =>
          supabase
            .from("question")
            .update({
              file_key: ttsResults[i].key,
              file_generated_at: new Date().toUTCString(),
            } as never)
            .eq("id", q.id)
            .throwOnError(),
        ),
      );
    }

    revalidatePath(urls.dashboard.forms.detail(formId));

    return questions;
  });

export const deleteFormAction = authenticatedActionClient
  .inputSchema(deleteFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;
    const { formId } = parsedInput;

    const { error } = await supabase
      .from("form")
      .delete()
      .eq("id", formId)
      .eq("user_id", userId);

    if (error) throw error;

    revalidatePath(urls.dashboard.forms.index);
  });

export const generateQuestionTTSAction = authenticatedActionClient
  .inputSchema(generateQuestionTTSSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;
    const { questionId, formId, language } = parsedInput;

    const { data: question } = await supabase
      .from("question")
      .select("question")
      .eq("id", questionId)
      .eq("user_id", userId)
      .single()
      .throwOnError();

    if (!question) throw new Error("Question not found.");

    const { url, key } = await generateTTS({
      text: question.question,
      formId,
      language: language as FormLanguage,
    });

    await supabase
      .from("question")
      .update({
        file_key: key,
        file_generated_at: new Date().toUTCString(),
      } as never)
      .eq("id", questionId)
      .throwOnError();

    return { url };
  });
