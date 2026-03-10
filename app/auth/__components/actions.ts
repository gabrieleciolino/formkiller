"use server";

import { loginFormSchema } from "@/app/auth/__components/schema";
import { publicActionClient } from "@/lib/actions";

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
