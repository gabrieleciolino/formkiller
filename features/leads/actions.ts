"use server";

import { getFormByIdQuery } from "@/features/forms/queries";
import { createLeadSchema } from "@/features/leads/schema";
import { publicActionClient } from "@/lib/actions";
import { urls } from "@/lib/urls";
import { revalidatePath } from "next/cache";

export const createLeadAction = publicActionClient
  .inputSchema(createLeadSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { name, email, phone, formId } = parsedInput;

    const form = await getFormByIdQuery({
      formId,
      supabase,
    });

    const { data, error } = await supabase
      .from("lead")
      .insert({
        name,
        email,
        phone,
        form_id: form.id,
        user_id: form.user_id,
      })
      .select()
      .single();

    if (error) {
      console.log("[create_form_action_error", error);
      throw error;
    }

    revalidatePath(urls.dashboard.forms.index);

    return data;
  });
