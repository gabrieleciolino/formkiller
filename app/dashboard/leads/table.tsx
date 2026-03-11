"use client";

import { DataTable } from "@/components/ui/data-table";
import { Lead } from "@/features/leads/types";
import { useLeadsColumns } from "./columns";

export default function LeadsTable({ data }: { data: Lead[] }) {
  const columns = useLeadsColumns();
  return <DataTable data={data} columns={columns} />;
}
