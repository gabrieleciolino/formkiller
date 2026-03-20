"use server";

import { DEFAULT_ACCOUNT_ROLE, DEFAULT_ACCOUNT_TIER } from "@/lib/account";
import { loginFormSchema, registerFormSchema } from "@/app/auth/__components/schema";
import { publicActionClient } from "@/lib/actions";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const loginAction = publicActionClient
  .inputSchema(loginFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { email, password } = parsedInput;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("[login_action_error]", error);
      throw error;
    }

    return data;
  });

export const registerAction = publicActionClient
  .inputSchema(registerFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { email, password } = parsedInput;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
      },
    });

    if (error || !data.user) {
      console.log("[register_action_error]", error);
      throw error ?? new Error("Unable to register user");
    }

    try {
      await supabaseAdmin
        .from("account")
        .upsert(
          {
            user_id: data.user.id,
            role: DEFAULT_ACCOUNT_ROLE,
            tier: DEFAULT_ACCOUNT_TIER,
          },
          { onConflict: "user_id" },
        )
        .throwOnError();
    } catch (accountError) {
      console.log("[register_account_insert_error]", {
        userId: data.user.id,
        message:
          accountError instanceof Error
            ? accountError.message
            : String(accountError),
      });
      throw accountError;
    }

    return {
      userId: data.user.id,
      session: data.session,
    };
  });
