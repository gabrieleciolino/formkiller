"use client";

import { Lead } from "@/features/leads/types";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<Lead>[] = [
  {
    accessorKey: "name",
    header: "Name",
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
