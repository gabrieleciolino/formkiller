import type { Metadata } from "next";
import PublicTestsList from "@/features/tests/components/public-tests-list";
import { getPublishedTestsListQuery } from "@/features/tests/queries";
import { publicQuery } from "@/lib/queries";

export const metadata: Metadata = {
  openGraph: {
    images: [{ url: "/ogimage-seituilproblema.png" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/ogimage-seituilproblema.png"],
  },
};

export default async function PublicTestsListPage() {
  const tests = await publicQuery(async ({ supabase }) =>
    getPublishedTestsListQuery({ supabase }),
  );

  return <PublicTestsList tests={tests} />;
}
