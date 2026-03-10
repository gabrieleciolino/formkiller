import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_SERVER_ERROR_MESSAGE,
  createSafeActionClient,
} from "next-safe-action";

class ActionAccessError extends Error {
  constructor(message: "Unauthorized" | "Forbidden") {
    super(message);
    this.name = "ActionAccessError";
  }
}

export const publicActionClient = createSafeActionClient({
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
});

export const authenticatedActionClient = publicActionClient.use(
  async ({ next }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error) {
      console.log("[safe_action_get_claims_error]", { message: error.message });
      throw new ActionAccessError("Unauthorized");
    }

    const userId = data?.claims?.sub;
    if (typeof userId !== "string" || userId.length === 0) {
      throw new ActionAccessError("Unauthorized");
    }

    return next({ ctx: { userId, supabase } });
  },
);
