import { supabaseAdmin } from "@/lib/supabase/admin";
import { UsersTableSearchParams } from "@/features/users/table-search-params";
import {
  TABLE_PAGE_SIZE,
  buildPaginatedResult,
  getPageRange,
  type PaginatedResult,
} from "@/lib/pagination";

const AUTH_USERS_PAGE_SIZE = 1000;

async function getAuthEmailsByUserId() {
  const emailsByUserId = new Map<string, string | null>();

  for (let page = 1; ; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: AUTH_USERS_PAGE_SIZE,
    });

    if (error) throw error;

    for (const user of data.users) {
      emailsByUserId.set(user.id, user.email ?? null);
    }

    if (data.users.length < AUTH_USERS_PAGE_SIZE) {
      break;
    }
  }

  return emailsByUserId;
}

async function getAccountsWithEmail({
  role,
  tier,
}: {
  role?: "admin" | "user";
  tier?: "free" | "pro";
}) {
  let query = supabaseAdmin
    .from("account")
    .select("user_id, username, role, tier, created_at")
    .order("created_at", { ascending: false });

  if (role) {
    query = query.eq("role", role);
  }

  if (tier) {
    query = query.eq("tier", tier);
  }

  const [{ data: accounts, error: accountsError }, emailsByUserId] =
    await Promise.all([
      query,
      getAuthEmailsByUserId(),
    ]);

  if (accountsError) throw accountsError;

  return (accounts ?? []).map((account) => ({
    ...account,
    email: emailsByUserId.get(account.user_id) ?? null,
  }));
}

export const getAdminUsersQuery = async () => {
  return getAccountsWithEmail({});
};

type AdminUserListItem = Awaited<ReturnType<typeof getAdminUsersQuery>>[number];

export const getAdminUsersTableQuery = async ({
  params,
}: {
  params: UsersTableSearchParams;
}): Promise<PaginatedResult<AdminUserListItem>> => {
  const { safePage, from, to } = getPageRange(params.page, TABLE_PAGE_SIZE);
  const searchTerm = params.q.trim().toLowerCase();

  const users = await getAccountsWithEmail({
    role: params.role === "all" ? undefined : params.role,
    tier: params.tier === "all" ? undefined : params.tier,
  });

  const filteredUsers = searchTerm
    ? users.filter((user) => {
        const username = user.username.toLowerCase();
        const email = (user.email ?? "").toLowerCase();

        return username.includes(searchTerm) || email.includes(searchTerm);
      })
    : users;

  const sortedUsers = [...filteredUsers].sort((left, right) => {
    const direction = params.dir === "asc" ? 1 : -1;

    if (params.sort === "username") {
      return left.username.localeCompare(right.username) * direction;
    }

    const leftDate = left.created_at ? Date.parse(left.created_at) : 0;
    const rightDate = right.created_at ? Date.parse(right.created_at) : 0;

    return (leftDate - rightDate) * direction;
  });

  return buildPaginatedResult({
    items: sortedUsers.slice(from, to + 1),
    total: sortedUsers.length,
    page: safePage,
    pageSize: TABLE_PAGE_SIZE,
  });
};
