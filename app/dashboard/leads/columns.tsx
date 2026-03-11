"use client";

import { Lead } from "@/features/leads/types";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<Lead>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ getValue }) => getValue<string | null>() ?? "—",
  },
  {
    id: "form",
    header: "Form",
    cell: ({ row }) => {
      const form = row.original.form as { name: string } | null;
      return form?.name ?? "—";
    },
  },
  {
    accessorKey: "created_at",
    header: "Created at",
    cell: ({ getValue }) => {
      const value = getValue<string | null>();
      if (!value) return "—";
      return new Date(value).toLocaleDateString();
    },
  },
];
