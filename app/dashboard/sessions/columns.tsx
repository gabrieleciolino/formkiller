"use client";

import { Session } from "@/features/sessions/types";
import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { useTranslations } from "next-intl";

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500/15 text-green-400 border-green-500/20",
  in_progress: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  pending: "bg-white/5 text-white/40 border-white/10",
};

export function useSessionsColumns(): ColumnDef<Session>[] {
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
      accessorKey: "status",
      header: t("dashboard.sessions.columns.status"),
      cell: ({ getValue }) => {
        const status = getValue<string>();
        const colorClass =
          STATUS_COLORS[status] ?? "bg-white/5 text-white/40 border-white/10";
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
        const answered = session.status === "completed" ? total : current;
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
