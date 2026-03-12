"use client";

import { DataTable } from "@/components/ui/data-table";
import { UserSession } from "@/features/sessions/types";
import { useSessionsColumns } from "./columns";

export default function SessionsTable({ data }: { data: UserSession[] }) {
  const columns = useSessionsColumns();
  return <DataTable data={data} columns={columns} />;
}
