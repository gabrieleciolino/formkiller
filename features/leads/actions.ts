"use server";

import { createLeadSchema } from "@/features/leads/schema";
import { publicActionClient } from "@/lib/actions";
import { urls } from "@/lib/urls";
import { revalidatePath } from "next/cache";

export const createLeadAction = publicActionClient
  .inputSchema(createLeadSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { name, email, phone, notes, formId, sessionId } = parsedInput;

    const { data: session, error: sessionError } = await supabase
      .from("form_session")
      .select("form_id, user_id")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError) {
      throw sessionError;
    }

    if (!session || session.form_id !== formId) {
      throw new Error("Invalid session/form association");
    }

    const { data, error } = await supabase
      .from("lead")
      .insert({
        name,
        email,
        phone,
        notes: notes ?? null,
        form_id: formId,
        user_id: session.user_id,
        form_session_id: sessionId,
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
