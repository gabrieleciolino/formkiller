"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const MAX_SIZE = 20 * 1024 * 1024;

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function UploadZone() {
  const t = useTranslations("dashboard.library.upload");
  const router = useRouter();
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState<{ name: string; done: number; total: number } | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/library/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? t("errorGeneric"));
      }
    },
    [t],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setStatus("uploading");
      setErrorMsg("");

      try {
        for (let i = 0; i < acceptedFiles.length; i++) {
          setProgress({ name: acceptedFiles[i].name, done: i, total: acceptedFiles.length });
          await uploadFile(acceptedFiles[i]);
        }
        setStatus("success");
        setProgress(null);
        router.refresh();
        setTimeout(() => setStatus("idle"), 2000);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : t("errorGeneric"));
        setStatus("error");
        setProgress(null);
      }
    },
    [uploadFile, router, t],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
      "video/*": [],
      "audio/*": [],
    },
    maxSize: MAX_SIZE,
    disabled: status === "uploading",
  });

  const rejectionError = fileRejections[0]?.errors[0];

  return (
    <div
      {...getRootProps()}
      className={`
        relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
        px-6 py-10 text-center transition-all duration-200 cursor-pointer outline-none
        ${isDragActive
          ? "border-ring bg-accent"
          : "border-border bg-muted/30 hover:border-ring/50 hover:bg-muted/50"
        }
        ${status === "uploading" ? "pointer-events-none opacity-60" : ""}
      `}
    >
      <input {...getInputProps()} />

      {status === "uploading" ? (
        <>
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {progress
              ? `${t("uploading")} ${progress.name}${progress.total > 1 ? ` (${progress.done + 1}/${progress.total})` : ""}`
              : t("uploading")}
          </p>
        </>
      ) : status === "success" ? (
        <>
          <CheckCircle2 className="size-8 text-green-500" />
          <p className="text-sm text-green-600 dark:text-green-400">{t("success")}</p>
        </>
      ) : status === "error" ? (
        <>
          <AlertCircle className="size-8 text-destructive" />
          <p className="text-sm text-destructive">{errorMsg || t("errorGeneric")}</p>
          <p className="text-xs text-muted-foreground">{t("dropAgain")}</p>
        </>
      ) : (
        <>
          <div className={`rounded-full p-3 transition-colors ${isDragActive ? "bg-accent-foreground/10" : "bg-muted"}`}>
            <CloudUpload className={`size-7 transition-colors ${isDragActive ? "text-foreground" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isDragActive ? t("dropNow") : t("dropHint")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("formats")}</p>
            <p className="text-xs text-muted-foreground/70">{t("maxSize")}</p>
          </div>
        </>
      )}

      {rejectionError && status === "idle" && (
        <p className="text-xs text-destructive mt-1">
          {rejectionError.code === "file-too-large" ? t("errorTooLarge") : t("errorType")}
        </p>
      )}
    </div>
  );
}
