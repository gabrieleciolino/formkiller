"use server";

import { createFormSchema } from "@/app/dashboard/__components/schema";
import { authenticatedActionClient } from "@/lib/actions";
import { urls } from "@/lib/urls";
import { revalidatePath } from "next/cache";

export const createFormAction = authenticatedActionClient
  .inputSchema(createFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;
    const { name, instructions } = parsedInput;

    const { data, error } = await supabase
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

    revalidatePath(urls.dashboard.forms.index);

    return data;
  });
