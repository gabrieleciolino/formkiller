"use client";

import { Button } from "@/components/ui/button";
import { AdminLead } from "@/features/leads/types";
import { urls } from "@/lib/urls";
import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function useAdminLeadsColumns(): ColumnDef<AdminLead>[] {
  const t = useTranslations();

  return [
    {
      accessorKey: "name",
      header: t("dashboard.leads.columns.name"),
    },
    {
      accessorKey: "email",
      header: t("dashboard.leads.columns.email"),
    },
    {
      accessorKey: "phone",
      header: t("dashboard.leads.columns.phone"),
    },
    {
      accessorKey: "user_id",
      header: t("dashboard.users.columns.userId"),
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{getValue<string | null>() ?? "—"}</span>
      ),
    },
    {
      id: "form",
      header: t("dashboard.leads.columns.form"),
      cell: ({ row }) => {
        const form = row.original.form as { name: string } | null;
        return form?.name ?? "—";
      },
    },
    {
      accessorKey: "created_at",
      header: t("dashboard.leads.columns.createdAt"),
      cell: ({ getValue }) => {
        const value = getValue<string | null>();
        if (!value) return "—";
        return format(parseISO(value), "dd MMM yyyy");
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button asChild size="sm" variant="outline">
          <Link href={urls.admin.leads.detail(row.original.id)}>
            {t("dashboard.leads.columns.view")}
          </Link>
        </Button>
      ),
    },
  ];
}
