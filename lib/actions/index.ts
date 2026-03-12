import "server-only";

import { setZodLocale } from "@/lib/zod/locale";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_SERVER_ERROR_MESSAGE,
  createSafeActionClient,
} from "next-safe-action";
import { cookies } from "next/headers";

class ActionAccessError extends Error {
  constructor(message: "Unauthorized" | "Forbidden") {
    super(message);
    this.name = "ActionAccessError";
  }
}

const baseActionClient = createSafeActionClient({
  handleServerError(error) {
    if (error instanceof ActionAccessError) {
      return error.message;
    }

    console.log("[safe_action_error]", {
      name: error.name,
      message: error.message,
    });

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
  defaultValidationErrorsShape: "flattened",
});

export const publicActionClient = baseActionClient.use(async ({ next }) => {
  const store = await cookies();
  setZodLocale(store.get("locale")?.value ?? "en");

  const supabase = await createClient();

  return next({ ctx: { supabase } });
});

export const authenticatedActionClient = publicActionClient.use(
  async ({ next, ctx }) => {
    const { supabase } = ctx;
    const { data, error } = await supabase.auth.getClaims();

    if (error) {
      console.log("[safe_action_get_claims_error]", { message: error.message });
      throw new ActionAccessError("Unauthorized");
    }

    const userId = data?.claims?.sub;
    if (typeof userId !== "string" || userId.length === 0) {
      throw new ActionAccessError("Unauthorized");
    }

    return next({ ctx: { ...ctx, userId } });
  },
);
