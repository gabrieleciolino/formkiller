"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/features/forms/types";
import { urls } from "@/lib/urls";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

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
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={urls.dashboard.forms.detail(row.original.id)}>View</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={urls.form(row.original.id)} target="_blank">Open</Link>
        </Button>
      </div>
    ),
  },
];
