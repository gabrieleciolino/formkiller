"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getAssetsForPickerAction } from "@/features/library/actions";
import { CheckCircle2, Music, ImageIcon, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type PickerAsset = {
  id: string;
  name: string;
  file_key: string;
  mime_type: string;
  type: "image" | "audio" | "video";
  size: number;
  url: string;
};

type Props = {
  type: "image" | "audio";
  value: string | null;
  /** currently selected asset url, for preview (resolved server-side) */
  previewUrl: string | null;
  onChange: (key: string | null) => void;
};

export default function LibraryPickerDialog({ type, value, previewUrl, onChange }: Props) {
  const t = useTranslations("forms.libraryPicker");
  const [open, setOpen] = useState(false);
  // null = not yet loaded; [] = loaded but empty
  const [assets, setAssets] = useState<PickerAsset[] | null>(null);

  useEffect(() => {
    if (!open) return;
    getAssetsForPickerAction({ type }).then(({ data }) => {
      setAssets((data as PickerAsset[] | undefined) ?? []);
    });
  }, [open, type]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setAssets(null);
  };

  const loading = open && assets === null;

  const handleSelect = (key: string) => {
    onChange(key === value ? null : key);
    setOpen(false);
  };

  const label = type === "image" ? t("backgroundImage") : t("backgroundMusic");

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>

      <div className="flex items-center gap-2">
        {/* Preview */}
        {value ? (
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
            {type === "image" && previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt=""
                className="size-8 rounded object-cover shrink-0"
              />
            ) : (
              <div className="flex size-8 shrink-0 items-center justify-center rounded bg-muted">
                <Music className="size-4 text-muted-foreground" />
              </div>
            )}
            <span className="truncate text-xs text-muted-foreground flex-1">
              {value.split("/").pop()}
            </span>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <p className="flex-1 text-xs text-muted-foreground">{t("none")}</p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleOpenChange(true)}
        >
          {t("select")}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (assets ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              {type === "image" ? (
                <ImageIcon className="size-8 text-muted-foreground/40" />
              ) : (
                <Music className="size-8 text-muted-foreground/40" />
              )}
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              {type === "image" ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {(assets ?? []).map((asset) => {
                    const selected = asset.file_key === value;
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => handleSelect(asset.file_key)}
                        className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                          selected
                            ? "border-ring"
                            : "border-transparent hover:border-border"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="h-full w-full object-cover"
                        />
                        {selected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <CheckCircle2 className="size-6 text-white" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-1.5 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          {asset.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {(assets ?? []).map((asset) => {
                    const selected = asset.file_key === value;
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => handleSelect(asset.file_key)}
                        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-all ${
                          selected
                            ? "border-ring bg-accent"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                          <Music className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{asset.name}</p>
                          <audio
                            src={asset.url}
                            controls
                            className="mt-1 h-7 w-full"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        {selected && (
                          <CheckCircle2 className="size-5 shrink-0 text-ring" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
