"use client";

import { DataTable } from "@/components/ui/data-table";
import type { AdminTest } from "@/features/tests/types";
import { useMemo } from "react";
import {
  type AdminTestsColumnsLabels,
  useAdminTestsColumns,
} from "./columns";

export default function AdminTestsTable({
  data,
  labels,
}: {
  data: AdminTest[];
  labels: AdminTestsColumnsLabels;
}) {
  const columns = useAdminTestsColumns(labels);
  const stableData = useMemo(() => data, [data]);

  return <DataTable data={stableData} columns={columns} />;
}
