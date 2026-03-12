"use server";

import { createUserSchema } from "@/features/users/schema";
import { adminActionClient } from "@/lib/actions";
import { urls } from "@/lib/urls";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export const createUserAction = adminActionClient
  .inputSchema(createUserSchema)
  .action(async ({ parsedInput }) => {
    const supabase = supabaseAdmin;
    const { email, password } = parsedInput;

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      throw error ?? new Error("User not created");
    }

    try {
      await supabase
        .from("account")
        .insert({
          user_id: data.user.id,
          role: parsedInput.role,
        })
        .throwOnError();
    } catch (accountError) {
      const { error: rollbackError } = await supabase.auth.admin.deleteUser(
        data.user.id,
      );

      if (rollbackError) {
        console.log("[create_user_rollback_error]", {
          userId: data.user.id,
          message: rollbackError.message,
        });
      }

      throw accountError;
    }

    revalidatePath(urls.admin.users.index);

    return { userId: data.user.id };
  });
