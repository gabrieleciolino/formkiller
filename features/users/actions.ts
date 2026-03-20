"use server";

import { createUserSchema, updateUserTierSchema } from "@/features/users/schema";
import { adminActionClient } from "@/lib/actions";
import { urls } from "@/lib/urls";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export const createUserAction = adminActionClient
  .inputSchema(createUserSchema)
  .action(async ({ parsedInput }) => {
    const supabase = supabaseAdmin;
    const { email, password } = parsedInput;
    const username = parsedInput.username.trim().toLowerCase();

    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from("account")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();

    if (usernameCheckError) {
      throw usernameCheckError;
    }

    if (existingUsername) {
      throw new Error("Username already in use");
    }

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
          username,
          role: parsedInput.role,
          tier: parsedInput.tier,
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

export const updateUserTierAction = adminActionClient
  .inputSchema(updateUserTierSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { userId, tier } = parsedInput;

    await supabase
      .from("account")
      .update({ tier })
      .eq("user_id", userId)
      .eq("role", "user")
      .throwOnError();

    revalidatePath(urls.admin.users.index);
  });
