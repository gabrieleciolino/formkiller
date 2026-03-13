import "server-only";

import {
  endAdminTrace,
  startAdminTrace,
  traceAdminStep,
} from "@/lib/observability/admin-trace";
import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/db/supabase.types";

type PublicQueryContext = {
  supabase: SupabaseClient<Database>;
};

type AuthenticatedQueryContext = PublicQueryContext & {
  userId: string;
};

export async function publicQuery<T>(
  fn: (ctx: PublicQueryContext) => Promise<T>,
): Promise<T> {
  const supabase = await createClient();
  return fn({ supabase });
}

export async function authenticatedQuery<T>(
  fn: (ctx: AuthenticatedQueryContext) => Promise<T>,
): Promise<T> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    throw new Error("Unauthorized");
  }

  return fn({ supabase, userId: data.claims.sub });
}

export async function adminQuery<T>(
  fn: (ctx: AuthenticatedQueryContext) => Promise<T>,
): Promise<T> {
  const trace = startAdminTrace("queries.adminQuery", {
    handler: fn.name || "anonymous",
  });

  let status = "ok";
  const supabase = await createClient();
  try {
    const { data, error } = await traceAdminStep(trace, "auth.getClaims", () =>
      supabase.auth.getClaims(),
    );

    if (error || !data?.claims?.sub) {
      status = "unauthorized_claims";
      throw new Error("Unauthorized");
    }

    const userId = data.claims.sub;

    const { data: account } = await traceAdminStep(
      trace,
      "db.account",
      () =>
        supabase
          .from("account")
          .select()
          .eq("user_id", userId)
          .single()
          .throwOnError(),
      { userId },
    );

    if (account.role !== "admin") {
      status = "unauthorized_role";
      throw new Error("Unauthorized");
    }

    const result = await traceAdminStep(trace, "handler", () =>
      fn({ supabase, userId: data.claims.sub }),
    );

    return result;
  } catch (error) {
    if (status === "ok") {
      status = "error";
    }
    throw error;
  } finally {
    endAdminTrace(trace, { status });
  }
}
