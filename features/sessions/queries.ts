import { TypedSupabaseClient } from "@/lib/supabase/types";
import { SessionsTableSearchParams } from "@/features/sessions/table-search-params";
import {
  TABLE_PAGE_SIZE,
  buildPaginatedResult,
  getPageRange,
  type PaginatedResult,
} from "@/lib/pagination";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUserIdsByUsernameSearch, getUsernamesByUserId } from "@/lib/account-usernames";

export const getUserSessionsQuery = async ({
  supabase,
  userId,
}: {
  supabase: TypedSupabaseClient;
  userId: string;
}) => {
  const { data, error } = await supabase
    .from("form_session")
    .select("*, form:form_id(name, questions:question(id))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
};

export const getSessionsQuery = getUserSessionsQuery;

export const getAdminSessionsQuery = async ({
  supabase,
}: {
  supabase: TypedSupabaseClient;
}) => {
  const { data, error } = await supabase
    .from("form_session")
    .select("*, form:form_id(name, questions:question(id))")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
};

type SessionListItem = Awaited<ReturnType<typeof getUserSessionsQuery>>[number] & {
  username: string | null;
};

async function getMatchingFormIdsByName(searchTerm: string) {
  if (!searchTerm) return [];

  const { data, error } = await supabaseAdmin
    .from("form")
    .select("id")
    .ilike("name", `%${searchTerm}%`)
    .limit(200);

  if (error) throw error;

  return (data ?? []).map((row) => row.id);
}

async function getSessionsTableQuery({
  supabase,
  userId,
  params,
}: {
  supabase: TypedSupabaseClient;
  userId?: string;
  params: SessionsTableSearchParams;
}): Promise<PaginatedResult<SessionListItem>> {
  const { safePage, from, to } = getPageRange(params.page, TABLE_PAGE_SIZE);
  const searchTerm = params.q.trim();

  let query = supabase
    .from("form_session")
    .select("*, form:form_id(name, questions:question(id))", { count: "exact" });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (searchTerm) {
    const [matchingFormIds, matchingUserIds] = await Promise.all([
      getMatchingFormIdsByName(searchTerm),
      getUserIdsByUsernameSearch(searchTerm),
    ]);

    const conditions: string[] = [];

    if (matchingFormIds.length > 0) {
      conditions.push(`form_id.in.(${matchingFormIds.join(",")})`);
    }
    if (matchingUserIds.length > 0) {
      conditions.push(`user_id.in.(${matchingUserIds.join(",")})`);
    }

    if (conditions.length === 0) {
      return buildPaginatedResult({
        items: [],
        total: 0,
        page: safePage,
        pageSize: TABLE_PAGE_SIZE,
      });
    }

    query = query.or(conditions.join(","));
  }

  if (params.sort === "form") {
    query = query.order("name", {
      referencedTable: "form",
      ascending: params.dir === "asc",
    });
  } else {
    query = query.order("created_at", { ascending: params.dir === "asc" });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw error;

  const sessions = data ?? [];
  const usernamesByUserId = await getUsernamesByUserId(
    sessions.map((session) => session.user_id),
  );

  const items = sessions.map((session) => ({
    ...session,
    username: usernamesByUserId.get(session.user_id) ?? null,
  }));

  return buildPaginatedResult({
    items,
    total: count ?? 0,
    page: safePage,
    pageSize: TABLE_PAGE_SIZE,
  });
}

export const getUserSessionsTableQuery = async ({
  supabase,
  userId,
  params,
}: {
  supabase: TypedSupabaseClient;
  userId: string;
  params: SessionsTableSearchParams;
}) => {
  return getSessionsTableQuery({
    supabase,
    userId,
    params,
  });
};

export const getAdminSessionsTableQuery = async ({
  supabase,
  params,
}: {
  supabase: TypedSupabaseClient;
  params: SessionsTableSearchParams;
}) => {
  return getSessionsTableQuery({
    supabase,
    params,
  });
};
