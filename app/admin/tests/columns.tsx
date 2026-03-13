"use client";

import { Button } from "@/components/ui/button";
import { deleteTestAction } from "@/features/tests/actions";
import { urls } from "@/lib/urls";
import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useTransition } from "react";
import type { AdminTest } from "@/features/tests/types";

export type AdminTestsColumnsLabels = {
  columns: {
    name: string;
    slug: string;
    language: string;
    status: string;
    createdAt: string;
    actions: string;
    view: string;
    open: string;
    delete: string;
    confirmDelete: string;
  };
  languages: {
    en: string;
    it: string;
    es: string;
  };
  statuses: {
    draft: string;
    published: string;
  };
};

function DeleteTestButton({
  testId,
  labels,
}: {
  testId: string;
  labels: AdminTestsColumnsLabels["columns"];
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(labels.confirmDelete)) {
      return;
    }

    startTransition(async () => {
      await deleteTestAction({ testId });
    });
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      onClick={handleDelete}
      disabled={isPending}
      title={labels.delete}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

export function useAdminTestsColumns(
  labels: AdminTestsColumnsLabels,
): ColumnDef<AdminTest>[] {
  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: labels.columns.name,
      },
      {
        accessorKey: "slug",
        header: labels.columns.slug,
      },
      {
        accessorKey: "language",
        header: labels.columns.language,
        cell: ({ getValue }) => {
          const value = getValue<string | null>();
          if (!value) return "—";
          if (value === "en" || value === "it" || value === "es") {
            return labels.languages[value];
          }
          return value;
        },
      },
      {
        accessorKey: "status",
        header: labels.columns.status,
        cell: ({ getValue }) => {
          const value = getValue<string | null>();
          if (!value) return "—";
          if (value === "draft" || value === "published") {
            return labels.statuses[value];
          }
          return value;
        },
      },
      {
        accessorKey: "created_at",
        header: labels.columns.createdAt,
        cell: ({ getValue }) => {
          const value = getValue<string | null>();
          if (!value) return "—";
          return format(parseISO(value), "dd MMM yyyy");
        },
      },
      {
        id: "actions",
        header: labels.columns.actions,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link
                href={urls.admin.tests.detail(row.original.id)}
                prefetch={false}
              >
                {labels.columns.view}
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="icon"
              title={labels.columns.open}
            >
              <Link
                href={urls.test(row.original.slug)}
                target="_blank"
                rel="noreferrer"
                prefetch={false}
              >
                <ExternalLink className="size-4" />
              </Link>
            </Button>

            <DeleteTestButton
              testId={row.original.id}
              labels={labels.columns}
            />
          </div>
        ),
      },
    ],
    [labels],
  );
}
