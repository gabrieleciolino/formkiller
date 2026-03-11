"use client";

import { DataTable } from "@/components/ui/data-table";
import { Form } from "@/features/forms/types";
import { useFormsColumns } from "./columns";

export default function FormsTable({ data }: { data: Form[] }) {
  const columns = useFormsColumns();
  return <DataTable data={data} columns={columns} />;
}
