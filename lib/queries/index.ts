import "server-only";

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
  async (): Promise<AuthenticatedQueryContext> => {
    const supabase = await getSupabaseForRequest();
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims?.sub) {
      throw new QueryAccessError("unauthorized_claims");
    }

    return { supabase, userId: data.claims.sub };
  },
);

const getAccountRoleForRequest = cache(async () => {
  const { supabase, userId } = await getAuthenticatedContextForRequest();
  const { data: account } = await supabase
    .from("account")
    .select("role")
    .eq("user_id", userId)
    .single()
    .throwOnError();

  return { userId, role: account.role };
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
    const { supabase, userId } = await getAuthenticatedContextForRequest();
    return fn({ supabase, userId });
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

    const { role } = await traceAdminStep(
      trace,
      "db.account",
      () => getAccountRoleForRequest(),
      { userId },
    );

    if (role !== "admin") {
      status = "unauthorized_role";
      redirect(urls.dashboard.index);
    }

    const result = await traceAdminStep(trace, "handler", () =>
      fn({ supabase, userId }),
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
