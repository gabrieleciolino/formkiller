import { columns } from "@/app/dashboard/forms/columns";
import { DataTable } from "@/components/ui/data-table";
import { Form } from "@/features/forms/types";

export default function FormsTable({ data }: { data: Form[] }) {
  return <DataTable data={data} columns={columns} />;
}
