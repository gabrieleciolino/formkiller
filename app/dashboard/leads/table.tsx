import { columns } from "@/app/dashboard/leads/columns";
import { DataTable } from "@/components/ui/data-table";
import { Lead } from "@/features/leads/types";

export default function LeadsTable({ data }: { data: Lead[] }) {
  return <DataTable data={data} columns={columns} />;
}
