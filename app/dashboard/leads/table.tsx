"use client";

import { DataTable } from "@/components/ui/data-table";
import { UserLead } from "@/features/leads/types";
import { useLeadsColumns } from "./columns";

export default function LeadsTable({ data }: { data: UserLead[] }) {
  const columns = useLeadsColumns();
  return <DataTable data={data} columns={columns} />;
}
