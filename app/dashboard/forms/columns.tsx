"use client";

import { Form } from "@/features/forms/types";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<Form>[] = [
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
