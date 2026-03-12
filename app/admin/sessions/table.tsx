"use client";

import { DataTable } from "@/components/ui/data-table";
import { AdminSession } from "@/features/sessions/types";
import { useAdminSessionsColumns } from "./columns";

export default function AdminSessionsTable({ data }: { data: AdminSession[] }) {
  const columns = useAdminSessionsColumns();
  return <DataTable data={data} columns={columns} />;
}
