"use client";

import { AdminSession } from "@/features/sessions/types";
import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { useTranslations } from "next-intl";

const STATUS_COLORS: Record<string, string> = {
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  abandoned: "border-orange-500/30 bg-orange-500/10 text-orange-700",
  in_progress: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  pending: "border-border bg-muted text-muted-foreground",
};

export function useAdminSessionsColumns(): ColumnDef<AdminSession>[] {
  const t = useTranslations();

  return [
    {
      id: "form",
      header: t("dashboard.sessions.columns.form"),
      cell: ({ row }) => {
        const form = row.original.form as { name: string } | null;
        return form?.name ?? "—";
      },
    },
    {
      accessorKey: "user_id",
      header: t("dashboard.users.columns.userId"),
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{getValue<string | null>() ?? "—"}</span>
      ),
    },
    {
      accessorKey: "status",
      header: t("dashboard.sessions.columns.status"),
      cell: ({ getValue }) => {
        const status = getValue<string>();
        const colorClass =
          STATUS_COLORS[status] ?? "border-border bg-muted text-muted-foreground";
        return (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
          >
            {t(`dashboard.sessions.status.${status}` as Parameters<typeof t>[0])}
          </span>
        );
      },
    },
    {
      id: "progress",
      header: t("dashboard.sessions.columns.progress"),
      cell: ({ row }) => {
        const session = row.original;
        const form = session.form as { questions: { id: string }[] } | null;
        const total = form?.questions?.length ?? 0;
        const current = session.current_question_index ?? 0;
        const answered =
          session.status === "completed" || session.status === "abandoned"
            ? total
            : current;
        if (total === 0) return "—";
        return `${answered} / ${total}`;
      },
    },
    {
      accessorKey: "created_at",
      header: t("dashboard.sessions.columns.createdAt"),
      cell: ({ getValue }) => {
        const value = getValue<string | null>();
        if (!value) return "—";
        return format(parseISO(value), "dd MMM yyyy, HH:mm");
      },
    },
  ];
}
