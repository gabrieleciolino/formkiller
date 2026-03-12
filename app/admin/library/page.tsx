import AssetGrid from "@/app/dashboard/library/asset-grid";
import UploadZone from "@/app/dashboard/library/upload-zone";
import { getAdminAssetsQuery } from "@/features/library/queries";
import { adminQuery } from "@/lib/queries";
import { getFileUrl } from "@/lib/r2/functions";
import { getTranslations } from "next-intl/server";

export default async function AdminLibraryPage() {
  const [assets, t] = await Promise.all([
    adminQuery(async ({ supabase }) => getAdminAssetsQuery({ supabase })),
    getTranslations(),
  ]);

  const assetsWithUrls = assets.map((a) => ({
    ...a,
    url: getFileUrl(a.file_key),
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-foreground">
        {t("dashboard.library.title")}
      </h2>
      <UploadZone />
      <AssetGrid assets={assetsWithUrls} />
    </div>
  );
}
