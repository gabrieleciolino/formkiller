"use server";

import {
  createFormSchema,
  editFormSchema,
  editQuestionsSchema,
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
    const { name, instructions, type } = parsedInput;

    const { data: form, error } = await supabase
      .from("form")
      .insert({
        name,
        instructions,
        type,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const output = await generateForm({ instructions });

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
        generateTTS({ text: q.question, formId: form.id }),
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
    const { name, instructions, formId, type } = parsedInput;

    const { data: form, error } = await supabase
      .from("form")
      .update({
        name,
        instructions,
        type,
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
    const { questions, formId } = parsedInput;

    const ids = questions.map((q) => q.id);

    const { data: currentQuestions } = await supabase
      .from("question")
      .select("id, question, form_id")
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
            formId: currentMap.get(q.id)!.form_id,
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

export const generateQuestionTTSAction = authenticatedActionClient
  .inputSchema(generateQuestionTTSSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;
    const { questionId, formId } = parsedInput;

    const { data: question } = await supabase
      .from("question")
      .select("question")
      .eq("id", questionId)
      .eq("user_id", userId)
      .single()
      .throwOnError();

    if (!question) throw new Error("Question not found.");

    const { url, key } = await generateTTS({ text: question.question, formId });

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
