import "server-only";

import {
  DEFAULT_ACCOUNT_TIER,
  isAdminRole,
  type AccountRole,
  type AccountTier,
} from "@/lib/account";
import {
  endAdminTrace,
  startAdminTrace,
  traceAdminStep,
} from "@/lib/observability/admin-trace";
import { createClient } from "@/lib/supabase/server";
import { urls } from "@/lib/urls";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/db/supabase.types";
import { redirect } from "next/navigation";
import { cache } from "react";

type PublicQueryContext = {
  supabase: SupabaseClient<Database>;
};

type AuthenticatedQueryContext = PublicQueryContext & {
  userId: string;
  userRole: AccountRole;
  userTier: AccountTier;
};

type AuthenticatedRequestContext = PublicQueryContext & {
  userId: string;
};

class QueryAccessError extends Error {
  constructor(public readonly kind: "unauthorized_claims") {
    super("Unauthorized");
    this.name = "QueryAccessError";
  }
}

const getSupabaseForRequest = cache(async (): Promise<SupabaseClient<Database>> => {
  return createClient();
});

const getAuthenticatedContextForRequest = cache(
  async (): Promise<AuthenticatedRequestContext> => {
    const supabase = await getSupabaseForRequest();
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims?.sub) {
      throw new QueryAccessError("unauthorized_claims");
    }

    return { supabase, userId: data.claims.sub };
  },
);

const getAccountContextForRequest = cache(async () => {
  const { supabase, userId } = await getAuthenticatedContextForRequest();
  const { data: account } = await supabase
    .from("account")
    .select("role, tier")
    .eq("user_id", userId)
    .single()
    .throwOnError();

  const role = account.role as AccountRole;
  const tier = (account.tier ?? DEFAULT_ACCOUNT_TIER) as AccountTier;

  return { userId, role, tier };
});

export async function publicQuery<T>(
  fn: (ctx: PublicQueryContext) => Promise<T>,
): Promise<T> {
  const supabase = await getSupabaseForRequest();
  return fn({ supabase });
}

export async function authenticatedQuery<T>(
  fn: (ctx: AuthenticatedQueryContext) => Promise<T>,
): Promise<T> {
  try {
    const { supabase } = await getAuthenticatedContextForRequest();
    const { userId, role, tier } = await getAccountContextForRequest();
    return fn({
      supabase,
      userId,
      userRole: role,
      userTier: tier,
    });
  } catch (error) {
    if (error instanceof QueryAccessError) {
      throw new Error("Unauthorized");
    }

    throw error;
  }
}

export async function adminQuery<T>(
  fn: (ctx: AuthenticatedQueryContext) => Promise<T>,
): Promise<T> {
  const trace = startAdminTrace("queries.adminQuery", {
    handler: fn.name || "anonymous",
  });

  let status = "ok";
  try {
    const { supabase, userId } = await traceAdminStep(trace, "auth.getClaims", () =>
      getAuthenticatedContextForRequest(),
    );

    const { role, tier } = await traceAdminStep(
      trace,
      "db.account",
      () => getAccountContextForRequest(),
      { userId },
    );

    if (!isAdminRole(role)) {
      status = "unauthorized_role";
      redirect(urls.dashboard.index);
    }

    const result = await traceAdminStep(trace, "handler", () =>
      fn({
        supabase,
        userId,
        userRole: role,
        userTier: tier,
      }),
    );

    return result;
  } catch (error) {
    if (status === "ok" && error instanceof QueryAccessError) {
      status = error.kind;
      redirect(urls.auth.login);
    }

    if (status === "ok") {
      status = "error";
    }
    throw error;
  } finally {
    endAdminTrace(trace, { status });
  }
}
