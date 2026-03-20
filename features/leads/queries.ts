import { TypedSupabaseClient } from "@/lib/supabase/types";
import { LeadsTableSearchParams } from "@/features/leads/table-search-params";
import {
  TABLE_PAGE_SIZE,
  buildPaginatedResult,
  getPageRange,
  type PaginatedResult,
} from "@/lib/pagination";

export const getUserLeadsQuery = async ({
  supabase,
  userId,
}: {
  supabase: TypedSupabaseClient;
  userId: string;
}) => {
  const { data, error } = await supabase
    .from("lead")
    .select("*, form:form_id(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
};

export const getLeadsQuery = getUserLeadsQuery;

export const getAdminLeadsQuery = async ({
  supabase,
}: {
  supabase: TypedSupabaseClient;
}) => {
  const { data, error } = await supabase
    .from("lead")
    .select("*, form:form_id(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
};

type LeadListItem = Awaited<ReturnType<typeof getUserLeadsQuery>>[number];

type EqFilterQuery<T> = {
  eq: (column: string, value: string) => T;
};

function applyLeadUserFilter<T extends EqFilterQuery<T>>(query: T, userId?: string): T {
  if (!userId) {
    return query;
  }

  return query.eq("user_id", userId);
}

async function getMatchingLeadIdsForSearch({
  supabase,
  userId,
  searchTerm,
}: {
  supabase: TypedSupabaseClient;
  userId?: string;
  searchTerm: string;
}) {
  const [nameResult, emailResult, phoneResult] = await Promise.all([
    applyLeadUserFilter(
      supabase.from("lead").select("id").ilike("name", `%${searchTerm}%`),
      userId,
    ),
    applyLeadUserFilter(
      supabase.from("lead").select("id").ilike("email", `%${searchTerm}%`),
      userId,
    ),
    applyLeadUserFilter(
      supabase.from("lead").select("id").ilike("phone", `%${searchTerm}%`),
      userId,
    ),
  ]);

  if (nameResult.error) throw nameResult.error;
  if (emailResult.error) throw emailResult.error;
  if (phoneResult.error) throw phoneResult.error;

  const ids = new Set<string>();

  for (const row of nameResult.data ?? []) {
    ids.add(row.id);
  }

  for (const row of emailResult.data ?? []) {
    ids.add(row.id);
  }

  for (const row of phoneResult.data ?? []) {
    ids.add(row.id);
  }

  return [...ids];
}

async function getLeadsTableQuery({
  supabase,
  userId,
  params,
}: {
  supabase: TypedSupabaseClient;
  userId?: string;
  params: LeadsTableSearchParams;
}): Promise<PaginatedResult<LeadListItem>> {
  const { safePage, from, to } = getPageRange(params.page, TABLE_PAGE_SIZE);
  const searchTerm = params.q.trim();

  let query = supabase
    .from("lead")
    .select("*, form:form_id(name)", { count: "exact" });

  query = applyLeadUserFilter(query, userId);

  if (searchTerm) {
    const matchingIds = await getMatchingLeadIdsForSearch({
      supabase,
      userId,
      searchTerm,
    });

    if (matchingIds.length === 0) {
      return buildPaginatedResult({
        items: [],
        total: 0,
        page: safePage,
        pageSize: TABLE_PAGE_SIZE,
      });
    }

    query = query.in("id", matchingIds);
  }

  if (params.sort === "name") {
    query = query.order("name", { ascending: params.dir === "asc" });
  } else {
    query = query.order("created_at", { ascending: params.dir === "asc" });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw error;

  return buildPaginatedResult({
    items: data ?? [],
    total: count ?? 0,
    page: safePage,
    pageSize: TABLE_PAGE_SIZE,
  });
}

export const getUserLeadsTableQuery = async ({
  supabase,
  userId,
  params,
}: {
  supabase: TypedSupabaseClient;
  userId: string;
  params: LeadsTableSearchParams;
}) => {
  return getLeadsTableQuery({
    supabase,
    userId,
    params,
  });
};

export const getAdminLeadsTableQuery = async ({
  supabase,
  params,
}: {
  supabase: TypedSupabaseClient;
  params: LeadsTableSearchParams;
}) => {
  return getLeadsTableQuery({
    supabase,
    params,
  });
};

const getLeadDetailBaseQuery = async ({
  supabase,
  leadId,
  userId,
}: {
  supabase: TypedSupabaseClient;
  leadId: string;
  userId?: string;
}) => {
  let leadQuery = supabase
    .from("lead")
    .select("*, form:form_id(name)")
    .eq("id", leadId);

  if (userId) {
    leadQuery = leadQuery.eq("user_id", userId);
  }

  const { data: lead, error } = await leadQuery.maybeSingle();

  if (error) throw error;
  if (!lead) return null;

  const { data: answers, error: answersError } = await supabase
    .from("answer")
    .select("*, question:question_id(question, order)")
    .eq("form_session_id", lead.form_session_id)
    .order("created_at", { ascending: true });

  if (answersError) throw answersError;

  return { lead, answers: answers ?? [] };
};

export const getUserLeadDetailQuery = async ({
  supabase,
  leadId,
  userId,
}: {
  supabase: TypedSupabaseClient;
  leadId: string;
  userId: string;
}) => {
  return getLeadDetailBaseQuery({ supabase, leadId, userId });
};

export const getAdminLeadDetailQuery = async ({
  supabase,
  leadId,
}: {
  supabase: TypedSupabaseClient;
  leadId: string;
}) => {
  return getLeadDetailBaseQuery({ supabase, leadId });
};

export const getLeadDetailQuery = getUserLeadDetailQuery;
