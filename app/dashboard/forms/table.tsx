"use client";

import { DataTable } from "@/components/ui/data-table";
import { DashboardForm } from "@/features/forms/types";
import { useFormsColumns } from "./columns";

export default function FormsTable({ data }: { data: DashboardForm[] }) {
  const columns = useFormsColumns();
  return <DataTable data={data} columns={columns} />;
}
