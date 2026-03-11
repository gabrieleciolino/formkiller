"use server";

import { createFormSchema } from "@/features/forms/schema";
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
      console.log("[create_form_action_error", error);
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
