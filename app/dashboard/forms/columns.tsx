"use client";

import { Button } from "@/components/ui/button";
import { deleteFormAction } from "@/features/forms/actions";
import { Form } from "@/features/forms/types";
import { urls } from "@/lib/urls";
import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useTransition } from "react";

function DeleteFormButton({ formId }: { formId: string }) {
  const t = useTranslations("dashboard.forms.columns");
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(t("confirmDelete"))) return;
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
      title={t("delete")}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

export function useFormsColumns(): ColumnDef<Form>[] {
  const t = useTranslations("dashboard.forms.columns");
  const tTypes = useTranslations("forms.types");
  const tLangs = useTranslations("forms.languages");

  return [
    {
      accessorKey: "name",
      header: t("name"),
    },
    {
      accessorKey: "type",
      header: t("type"),
      cell: ({ getValue }) => {
        const value = getValue<string | null>();
        if (!value) return "—";
        return tTypes(value as Parameters<typeof tTypes>[0]);
      },
    },
    {
      accessorKey: "language",
      header: t("language"),
      cell: ({ getValue }) => {
        const value = getValue<string | null>();
        if (!value) return "—";
        return tLangs(value as Parameters<typeof tLangs>[0]);
      },
    },
    {
      accessorKey: "created_at",
      header: t("createdAt"),
      cell: ({ getValue }) => {
        const value = getValue<string | null>();
        if (!value) return "—";
        return format(parseISO(value), "dd MMM yyyy");
      },
    },
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={urls.dashboard.forms.detail(row.original.id)}>
              {t("view")}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={urls.form(row.original.id)} target="_blank">
              {t("open")}
            </Link>
          </Button>
          <DeleteFormButton formId={row.original.id} />
        </div>
      ),
    },
  ];
}
