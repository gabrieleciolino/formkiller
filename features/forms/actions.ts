"use server";

import {
  createFormSchema,
  editFormSchema,
  editQuestionsSchema,
} from "@/features/forms/schema";
import { authenticatedActionClient } from "@/lib/actions";
import { generateForm } from "@/lib/ai/functions";
import { urls } from "@/lib/urls";
import { revalidatePath } from "next/cache";

export const createFormAction = authenticatedActionClient
  .inputSchema(createFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;
    const { name, instructions } = parsedInput;

    const { data: form, error } = await supabase
      .from("form")
      .insert({
        name,
        instructions,
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
        .select(),
    );

    await Promise.all(insertPromises);

    revalidatePath(urls.dashboard.forms.index);

    return form;
  });

export const editFormAction = authenticatedActionClient
  .inputSchema(editFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;
    const { name, instructions, formId } = parsedInput;

    const { data: form, error } = await supabase
      .from("form")
      .update({
        name,
        instructions,
      })
      .eq("id", formId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return form;
  });

export const editQuestionsAction = authenticatedActionClient
  .inputSchema(editQuestionsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;
    const { questions } = parsedInput;

    const updatePromises = questions.map((q) =>
      supabase
        .from("question")
        .update({
          question: q.question,
          default_answers: q.default_answers,
        })
        .eq("id", q.id)
        .eq("user_id", userId)
        .throwOnError(),
    );

    await Promise.all(updatePromises);

    return questions;
  });
