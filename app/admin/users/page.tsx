import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CreateUserSheet from "@/features/users/components/create-user-sheet";
import UsersTableControls from "@/features/users/components/users-table-controls";
import UserTierToggle from "@/features/users/components/user-tier-toggle";
import { getAdminUsersTableQuery } from "@/features/users/queries";
import { usersTableSearchParamsParsers } from "@/features/users/table-search-params";
import { adminQuery } from "@/lib/queries";
import { getTranslations } from "next-intl/server";
import { createLoader } from "nuqs/server";

const loadUsersTableSearchParams = createLoader(usersTableSearchParamsParsers);

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await loadUsersTableSearchParams(searchParams);
  const [usersResult, t] = await Promise.all([
    adminQuery(async () => getAdminUsersTableQuery({ params })),
    getTranslations(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-foreground">
          {t("dashboard.users.title")}
        </h2>
        <CreateUserSheet />
      </div>

      <UsersTableControls
        page={params.page}
        total={usersResult.total}
        totalPages={usersResult.totalPages}
      />

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("dashboard.users.columns.username")}</TableHead>
              <TableHead>{t("dashboard.users.columns.email")}</TableHead>
              <TableHead>{t("dashboard.users.columns.role")}</TableHead>
              <TableHead>{t("dashboard.users.columns.tier")}</TableHead>
              <TableHead>{t("dashboard.users.columns.createdAt")}</TableHead>
              <TableHead>{t("dashboard.users.columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersResult.items.length === 0 ? (
              <TableRow>
                <TableCell
                  className="text-muted-foreground"
                  colSpan={6}
                >
                  {t("dashboard.users.empty")}
                </TableCell>
              </TableRow>
            ) : (
              usersResult.items.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-mono text-xs">{user.username}</TableCell>
                  <TableCell>{user.email ?? "—"}</TableCell>
                  <TableCell>
                    {t(
                      `dashboard.users.roles.${user.role}` as Parameters<
                        typeof t
                      >[0],
                    )}
                  </TableCell>
                  <TableCell>
                    {t(
                      `dashboard.users.tiers.${user.tier ?? "free"}` as Parameters<
                        typeof t
                      >[0],
                    )}
                  </TableCell>
                  <TableCell>
                    {user.created_at
                      ? new Date(user.created_at).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {user.role === "user" ? (
                      <UserTierToggle
                        userId={user.user_id}
                        currentTier={user.tier ?? "free"}
                      />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
