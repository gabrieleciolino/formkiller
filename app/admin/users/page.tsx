import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminUsersQuery } from "@/features/users/queries";
import { adminQuery } from "@/lib/queries";
import { getTranslations } from "next-intl/server";

export default async function AdminUsersPage() {
  const [users, t] = await Promise.all([
    adminQuery(async ({ supabase }) => getAdminUsersQuery({ supabase })),
    getTranslations(),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-foreground">
        {t("dashboard.users.title")}
      </h2>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("dashboard.users.columns.userId")}</TableHead>
              <TableHead>{t("dashboard.users.columns.role")}</TableHead>
              <TableHead>{t("dashboard.users.columns.createdAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  className="text-muted-foreground"
                  colSpan={3}
                >
                  {t("dashboard.users.empty")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-mono text-xs">{user.user_id}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    {user.created_at
                      ? new Date(user.created_at).toLocaleString()
                      : "—"}
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
