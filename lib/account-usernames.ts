import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getUsernamesByUserId(userIds: string[]) {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueUserIds.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabaseAdmin
    .from("account")
    .select("user_id, username")
    .in("user_id", uniqueUserIds);

  if (error) throw error;

  return new Map((data ?? []).map((row) => [row.user_id, row.username]));
}

export async function getUserIdsByUsernameSearch(search: string) {
  const term = search.trim();
  if (!term) return [];

  const { data, error } = await supabaseAdmin
    .from("account")
    .select("user_id")
    .ilike("username", `%${term}%`)
    .limit(200);

  if (error) throw error;

  return (data ?? []).map((row) => row.user_id);
}
