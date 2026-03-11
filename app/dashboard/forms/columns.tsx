"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/features/forms/types";
import { urls } from "@/lib/urls";
import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import Link from "next/link";

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
        return new Date(value).toLocaleDateString();
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
        </div>
      ),
    },
  ];
}
