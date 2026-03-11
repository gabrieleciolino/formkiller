import "server-only";

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
