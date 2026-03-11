import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import { getAssetsQuery } from "@/features/library/queries";
import { authenticatedQuery } from "@/lib/queries";
import { getFileUrl } from "@/lib/r2/functions";
import { getTranslations } from "next-intl/server";
import AssetGrid from "./asset-grid";
import UploadZone from "./upload-zone";

export default async function LibraryPage() {
  const [assets, t] = await Promise.all([
    authenticatedQuery(async ({ supabase, userId }) =>
      getAssetsQuery({ supabase, userId }),
    ),
    getTranslations("dashboard.library"),
  ]);

  const assetsWithUrls = assets.map((a) => ({
    ...a,
    url: getFileUrl(a.file_key),
  }));

  return (
    <DashboardWrapper title={t("title")}>
      <div className="space-y-6">
        <UploadZone />
        <AssetGrid assets={assetsWithUrls} />
      </div>
    </DashboardWrapper>
  );
}
