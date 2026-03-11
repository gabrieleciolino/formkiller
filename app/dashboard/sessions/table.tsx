"use client";

import { DataTable } from "@/components/ui/data-table";
import { Session } from "@/features/sessions/types";
import { useSessionsColumns } from "./columns";

export default function SessionsTable({ data }: { data: Session[] }) {
  const columns = useSessionsColumns();
  return <DataTable data={data} columns={columns} />;
}
