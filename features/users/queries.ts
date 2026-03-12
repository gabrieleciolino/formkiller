import { supabaseAdmin } from "@/lib/supabase/admin";

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
}: {
  role?: "admin" | "user";
}) {
  let query = supabaseAdmin
    .from("account")
    .select("user_id, role, created_at")
    .order("created_at", { ascending: false });

  if (role) {
    query = query.eq("role", role);
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

export const getAssignableUsersQuery = async () => {
  return getAccountsWithEmail({ role: "user" });
};
