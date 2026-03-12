"use client";

import { DataTable } from "@/components/ui/data-table";
import { Form } from "@/features/forms/types";
import { useAdminFormsColumns } from "./columns";

export default function AdminFormsTable({ data }: { data: Form[] }) {
  const columns = useAdminFormsColumns();
  return <DataTable data={data} columns={columns} />;
}
