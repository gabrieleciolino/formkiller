"use client";

import { Button } from "@/components/ui/button";
import { deleteFormAction } from "@/features/forms/actions";
import { DashboardForm } from "@/features/forms/types";
import { urls } from "@/lib/urls";
import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useTransition } from "react";

function DeleteFormButton({ formId }: { formId: string }) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(t("dashboard.forms.columns.confirmDelete"))) return;
    startTransition(async () => {
      await deleteFormAction({ formId });
    });
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      onClick={handleDelete}
      disabled={isPending}
      title={t("dashboard.forms.columns.delete")}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

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
        const formSlug = row.original.slug;
        const isPublished = row.original.is_published;

        return (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={urls.dashboard.forms.detail(row.original.id)}>
                {t("dashboard.forms.columns.view")}
              </Link>
            </Button>
            {isPublished && formSlug ? (
              <Button asChild size="sm" variant="outline">
                <Link href={urls.form(formSlug)} target="_blank">
                  {t("dashboard.forms.columns.open")}
                </Link>
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled>
                {t("dashboard.forms.columns.open")}
              </Button>
            )}
            <DeleteFormButton formId={row.original.id} />
          </div>
        );
      },
    },
  ];
}
