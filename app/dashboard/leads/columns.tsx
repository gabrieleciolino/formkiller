"use client";

import { Button } from "@/components/ui/button";
import { Lead } from "@/features/leads/types";
import { urls } from "@/lib/urls";
import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function useLeadsColumns(): ColumnDef<Lead>[] {
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
      accessorKey: "notes",
      header: t("dashboard.leads.columns.notes"),
      cell: ({ getValue }) => getValue<string | null>() ?? "—",
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
          <Link href={urls.dashboard.leads.detail(row.original.id)}>
            {t("dashboard.leads.columns.view")}
          </Link>
        </Button>
      ),
    },
  ];
}
