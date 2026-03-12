"use client";

import { Button } from "@/components/ui/button";
import { DashboardForm } from "@/features/forms/types";
import { urls } from "@/lib/urls";
import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function useFormsColumns(): ColumnDef<DashboardForm>[] {
  const t = useTranslations();

  return [
    {
      accessorKey: "name",
      header: t("dashboard.forms.columns.name"),
    },
    {
      accessorKey: "type",
      header: t("dashboard.forms.columns.type"),
      cell: ({ getValue }) => {
        const value = getValue<string | null>();
        if (!value) return "—";
        return t(`forms.types.${value}` as Parameters<typeof t>[0]);
      },
    },
    {
      accessorKey: "language",
      header: t("dashboard.forms.columns.language"),
      cell: ({ getValue }) => {
        const value = getValue<string | null>();
        if (!value) return "—";
        return t(`forms.languages.${value}` as Parameters<typeof t>[0]);
      },
    },
    {
      accessorKey: "created_at",
      header: t("dashboard.forms.columns.createdAt"),
      cell: ({ getValue }) => {
        const value = getValue<string | null>();
        if (!value) return "—";
        return format(parseISO(value), "dd MMM yyyy");
      },
    },
    {
      id: "actions",
      header: t("dashboard.forms.columns.actions"),
      cell: ({ row }) => {
        const assignmentId = row.original.assignment_id;

        return (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={urls.dashboard.forms.detail(row.original.id)}>
                {t("dashboard.forms.columns.view")}
              </Link>
            </Button>
            {assignmentId ? (
              <Button asChild size="sm" variant="outline">
                <Link href={urls.formAssignment(assignmentId)} target="_blank">
                  {t("dashboard.forms.columns.open")}
                </Link>
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled>
                {t("dashboard.forms.columns.open")}
              </Button>
            )}
          </div>
        );
      },
    },
  ];
}
