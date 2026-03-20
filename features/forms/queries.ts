import { TypedSupabaseClient } from "@/lib/supabase/types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { FormTableSearchParams } from "@/features/forms/table-search-params";
import { getUserIdsByUsernameSearch, getUsernamesByUserId } from "@/lib/account-usernames";
import {
  TABLE_PAGE_SIZE,
  buildPaginatedResult,
  getPageRange,
  type PaginatedResult,
} from "@/lib/pagination";
import {
  endAdminTrace,
  startAdminTrace,
  traceAdminStep,
} from "@/lib/observability/admin-trace";

type PublicViewerQuestionRow = {
  id: string;
  question: string;
  order: number;
  file_key: string | null;
  default_answers: { answer: string; order: number }[];
};

type PublicViewerFormRow = {
  id: string;
  slug: string | null;
  owner_username: string;
  name: string;
  type: string | null;
  theme: string | null;
  language: string | null;
  user_id: string;
  background_image_key: string | null;
  background_music_key: string | null;
  intro_title: string | null;
  intro_message: string | null;
  end_title: string | null;
  end_message: string | null;
  is_published: boolean;
  questions: PublicViewerQuestionRow[] | null;
};

export type PublicViewerForm = PublicViewerFormRow;

async function getUsernameByUserId(userId: string) {
  const usernamesByUserId = await getUsernamesByUserId([userId]);
  return usernamesByUserId.get(userId) ?? null;
}

function normalizeSearchTerm(value: string) {
  return value.trim();
}

type EqFilterQuery<T> = {
  eq: (column: string, value: string) => T;
};

function applyFormListFilters<T extends EqFilterQuery<T>>(
  query: T,
  {
    userId,
    language,
    type,
  }: {
    userId?: string;
    language: FormTableSearchParams["language"];
    type: FormTableSearchParams["type"];
  },
): T {
  let nextQuery = query;

  if (userId) {
    nextQuery = nextQuery.eq("user_id", userId);
  }

  if (language !== "all") {
    nextQuery = nextQuery.eq("language", language);
  }

  if (type !== "all") {
    nextQuery = nextQuery.eq("type", type);
  }

  return nextQuery;
}

async function getMatchingFormIdsForSearch({
  supabase,
  userId,
  searchTerm,
  language,
  type,
}: {
  supabase: TypedSupabaseClient;
  userId?: string;
  searchTerm: string;
  language: FormTableSearchParams["language"];
  type: FormTableSearchParams["type"];
}) {
  const ownerUserIds = await getUserIdsByUsernameSearch(searchTerm);

  const [formsByNameResult, formsByOwnerResult] = await Promise.all([
    applyFormListFilters(
      supabase.from("form").select("id").ilike("name", `%${searchTerm}%`),
      { userId, language, type },
    ),
    ownerUserIds.length > 0
      ? applyFormListFilters(
          supabase
            .from("form")
            .select("id")
            .in("user_id", ownerUserIds),
          { userId, language, type },
        )
      : Promise.resolve({ data: [] as Array<{ id: string }>, error: null }),
  ]);

  if (formsByNameResult.error) throw formsByNameResult.error;
  if (formsByOwnerResult.error) throw formsByOwnerResult.error;

  const ids = new Set<string>();

  for (const row of formsByNameResult.data ?? []) {
    ids.add(row.id);
  }

  for (const row of formsByOwnerResult.data ?? []) {
    ids.add(row.id);
  }

  return [...ids];
}

type FormListItem = Awaited<ReturnType<typeof getUserFormsQuery>>[number];

async function getFormsTableQuery({
  supabase,
  params,
  userId,
}: {
  supabase: TypedSupabaseClient;
  params: FormTableSearchParams;
  userId?: string;
}): Promise<PaginatedResult<FormListItem>> {
  const { safePage, from, to } = getPageRange(params.page, TABLE_PAGE_SIZE);
  const searchTerm = normalizeSearchTerm(params.q);

  let query = applyFormListFilters(
    supabase
      .from("form")
      .select(
        "id, user_id, name, slug, type, language, is_published, instructions, theme, created_at, updated_at, voice_id, voice_speed, background_image_key, background_music_key, intro_title, intro_message, end_title, end_message, analysis_instructions, questions:question(*)",
        { count: "exact" },
      ),
    {
      userId,
      language: params.language,
      type: params.type,
    },
  );

  if (searchTerm) {
    const matchingIds = await getMatchingFormIdsForSearch({
      supabase,
      userId,
      searchTerm,
      language: params.language,
      type: params.type,
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

  const forms = data ?? [];
  const usernamesByUserId = await getUsernamesByUserId(
    forms.map((form) => form.user_id),
  );
  const items = forms.map((form) => ({
    ...form,
    owner_username: usernamesByUserId.get(form.user_id) ?? null,
  }));

  return buildPaginatedResult({
    items,
    total: count ?? 0,
    page: safePage,
    pageSize: TABLE_PAGE_SIZE,
  });
}

export const getUserFormsQuery = async ({
  userId,
  supabase,
}: {
  userId: string;
  supabase: TypedSupabaseClient;
}) => {
  const { data, error } = await supabase
    .from("form")
    .select("*, questions:question(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const forms = data ?? [];
  const usernamesByUserId = await getUsernamesByUserId(
    forms.map((form) => form.user_id),
  );

  return forms.map((form) => ({
    ...form,
    owner_username: usernamesByUserId.get(form.user_id) ?? null,
  }));
};

export const getFormsQuery = getUserFormsQuery;

export const getAdminFormsQuery = async ({
  supabase,
}: {
  supabase: TypedSupabaseClient;
}) => {
  const trace = startAdminTrace("forms.getAdminFormsQuery");
  let rowCount = 0;
  let status = "ok";

  try {
    const { data, error } = await traceAdminStep(trace, "db.select.form", () =>
      supabase
        .from("form")
        .select("*, questions:question(*)")
        .order("created_at", { ascending: false }),
    );

    if (error) {
      status = "error";
      throw error;
    }

    const forms = data ?? [];
    rowCount = forms.length;
    const usernamesByUserId = await traceAdminStep(trace, "db.account.usernames", () =>
      getUsernamesByUserId(forms.map((form) => form.user_id)),
    );

    return forms.map((form) => ({
      ...form,
      owner_username: usernamesByUserId.get(form.user_id) ?? null,
    }));
  } finally {
    endAdminTrace(trace, { status, rowCount });
  }
};

export const getUserFormsTableQuery = async ({
  userId,
  supabase,
  params,
}: {
  userId: string;
  supabase: TypedSupabaseClient;
  params: FormTableSearchParams;
}) => {
  return getFormsTableQuery({
    userId,
    supabase,
    params,
  });
};

export const getAdminFormsTableQuery = async ({
  supabase,
  params,
}: {
  supabase: TypedSupabaseClient;
  params: FormTableSearchParams;
}) => {
  return getFormsTableQuery({
    supabase,
    params,
  });
};

export const getFormByIdQuery = async ({
  formId,
  supabase,
}: {
  formId: string;
  supabase: TypedSupabaseClient;
}) => {
  const { data } = await supabase
    .from("form")
    .select("*, questions:question(*)")
    .eq("id", formId)
    .order("order", { referencedTable: "question", ascending: true })
    .single()
    .throwOnError();

  const ownerUsername = await getUsernameByUserId(data.user_id);

  return {
    ...data,
    owner_username: ownerUsername,
  };
};

export const getUserFormByIdQuery = async ({
  formId,
  userId,
  supabase,
}: {
  formId: string;
  userId: string;
  supabase: TypedSupabaseClient;
}) => {
  const { data, error } = await supabase
    .from("form")
    .select("*, questions:question(*)")
    .eq("id", formId)
    .eq("user_id", userId)
    .order("order", { referencedTable: "question", ascending: true })
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const ownerUsername = await getUsernameByUserId(data.user_id);

  return {
    ...data,
    owner_username: ownerUsername,
  };
};

export const getPublishedFormViewerByUsernameAndSlugQuery = async ({
  username,
  slug,
}: {
  username: string;
  slug: string;
}) => {
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedSlug = slug.trim();

  if (!normalizedUsername || !normalizedSlug) {
    return null;
  }

  const { data: account, error: accountError } = await supabaseAdmin
    .from("account")
    .select("user_id, username")
    .eq("username", normalizedUsername)
    .maybeSingle();

  if (accountError) throw accountError;
  if (!account) return null;

  const { data, error } = await supabaseAdmin
    .from("form")
    .select(
      "id, slug, name, type, theme, language, user_id, background_image_key, background_music_key, intro_title, intro_message, end_title, end_message, is_published, questions:question(id, question, order, file_key, default_answers)",
    )
    .eq("user_id", account.user_id)
    .eq("slug", normalizedSlug)
    .eq("is_published", true)
    .order("order", { referencedTable: "question", ascending: true })
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as PublicViewerFormRow;

  return {
    ...row,
    owner_username: account.username,
    questions: [...(row.questions ?? [])].sort((left, right) => left.order - right.order),
  } satisfies PublicViewerForm;
};
