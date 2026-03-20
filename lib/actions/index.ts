import "server-only";

import {
  DEFAULT_ACCOUNT_TIER,
  isAdminRole,
  type AccountRole,
  type AccountTier,
} from "@/lib/account";
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

    const candidate = error as Error & {
      cause?: unknown;
      digest?: string;
      statusCode?: number;
      code?: string;
      details?: unknown;
      hint?: string;
    };

    console.log("[safe_action_error]", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: candidate.digest,
      statusCode: candidate.statusCode,
      code: candidate.code,
      hint: candidate.hint,
      details: candidate.details,
      cause:
        candidate.cause instanceof Error
          ? {
              name: candidate.cause.name,
              message: candidate.cause.message,
              stack: candidate.cause.stack,
            }
          : candidate.cause,
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

    const { data: account } = await supabase
      .from("account")
      .select("role, tier")
      .eq("user_id", userId)
      .single()
      .throwOnError();

    const role = account.role as AccountRole;
    const tier = (account.tier ?? DEFAULT_ACCOUNT_TIER) as AccountTier;

    return next({
      ctx: {
        ...ctx,
        userId,
        userRole: role,
        userTier: tier,
      },
    });
  },
);

export const adminActionClient = authenticatedActionClient.use(
  async ({ next, ctx }) => {
    if (!isAdminRole(ctx.userRole)) {
      throw new ActionAccessError("Unauthorized");
    }

    return next({ ctx });
  },
);
