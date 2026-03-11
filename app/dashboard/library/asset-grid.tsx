"use client";

import { deleteAssetAction } from "@/features/library/actions";
import { Asset } from "@/features/library/types";
import { format, parseISO } from "date-fns";
import { Music, Trash2, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AssetCard({ asset }: { asset: Asset & { url: string } }) {
  const t = useTranslations("dashboard.library");
  const [isPending, startTransition] = useTransition();
  const { url } = asset;

  const handleDelete = () => {
    if (!confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      await deleteAssetAction({ id: asset.id, fileKey: asset.file_key });
    });
  };

  return (
    <div
      className={`group relative rounded-xl overflow-hidden border border-border bg-card shadow-sm transition-all ${isPending ? "opacity-50 pointer-events-none" : ""}`}
    >
      {/* Media preview */}
      <div className="aspect-video w-full bg-muted flex items-center justify-center overflow-hidden">
        {asset.type === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={asset.name}
            className="h-full w-full object-cover"
          />
        )}
        {asset.type === "video" && (
          <video
            src={url}
            className="h-full w-full object-cover"
            preload="metadata"
            controls
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {asset.type === "audio" && (
          <div className="flex flex-col items-center gap-3 p-4 w-full">
            <div className="rounded-full bg-muted p-4">
              <Music className="size-8 text-muted-foreground" />
            </div>
            <audio
              src={url}
              controls
              className="w-full max-w-[240px]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="flex items-start justify-between gap-2 px-3 py-2">
        <div className="min-w-0">
          <p
            className="truncate text-sm font-medium text-foreground"
            title={asset.name}
          >
            {asset.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(asset.size)}
            {asset.created_at && (
              <> · {format(parseISO(asset.created_at), "dd MMM yyyy")}</>
            )}
          </p>
        </div>

        {/* Type badge */}
        <span className="shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-0.5">
          {asset.type === "video" && <Video className="size-3" />}
          {asset.type === "audio" && <Music className="size-3" />}
          {asset.type}
        </span>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 transition-all hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100 backdrop-blur-sm"
        title={t("delete")}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

export default function AssetGrid({ assets }: { assets: (Asset & { url: string })[] }) {
  const t = useTranslations("dashboard.library");

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
    </div>
  );
}
