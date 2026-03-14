import PublicTestsList from "@/features/tests/components/public-tests-list";
import { getPublishedTestsListQuery } from "@/features/tests/queries";
import { publicQuery } from "@/lib/queries";

export default async function PublicTestsListPage() {
  const tests = await publicQuery(async ({ supabase }) =>
    getPublishedTestsListQuery({ supabase }),
  );

  return <PublicTestsList tests={tests} />;
}
