"use client";

import { Lead } from "@/features/leads/types";
import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";

export function useLeadsColumns(): ColumnDef<Lead>[] {
  const t = useTranslations("dashboard.leads.columns");

  return [
    {
      accessorKey: "name",
      header: t("name"),
    },
    {
      accessorKey: "email",
      header: t("email"),
    },
    {
      accessorKey: "phone",
      header: t("phone"),
    },
    {
      accessorKey: "notes",
      header: t("notes"),
      cell: ({ getValue }) => getValue<string | null>() ?? "—",
    },
    {
      id: "form",
      header: t("form"),
      cell: ({ row }) => {
        const form = row.original.form as { name: string } | null;
        return form?.name ?? "—";
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
  ];
}
