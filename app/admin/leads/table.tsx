"use client";

import { DataTable } from "@/components/ui/data-table";
import { AdminLead } from "@/features/leads/types";
import { useAdminLeadsColumns } from "./columns";

export default function AdminLeadsTable({ data }: { data: AdminLead[] }) {
  const columns = useAdminLeadsColumns();
  return <DataTable data={data} columns={columns} />;
}
