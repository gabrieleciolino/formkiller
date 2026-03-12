"use client";

import type { FormViewerCompletedPhaseProps } from "@/features/forms/types";
import { CheckCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

export function CompletedPhase({
  bgStyle,
  endMessage,
  endTitle,
  analysisText,
  analysisAudioUrl,
  hasBackgroundImage,
  isDark,
  tk,
}: FormViewerCompletedPhaseProps) {
  const t = useTranslations();
  const resolvedTitle = endTitle?.trim() || t("viewer.completed.title");
  const resolvedMessage =
    analysisText?.trim() ||
    endMessage?.trim() ||
    t("viewer.completed.message");
  const analysisAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!analysisAudioUrl || !analysisAudioRef.current) {
      return;
    }

    void analysisAudioRef.current.play().catch(() => {});
  }, [analysisAudioUrl]);

  return (
    <div
      className={`relative flex h-dvh flex-col items-center justify-center overflow-hidden p-6 ${tk.bg} ${tk.text}`}
      style={bgStyle}
    >
      {hasBackgroundImage && <div className={`absolute inset-0 ${tk.overlay}`} />}

      <div className="relative flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div
          className={`flex size-20 items-center justify-center rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}
        >
          <CheckCircleIcon className="size-10" />
        </div>

        <h1 className="text-4xl font-black">{resolvedTitle}</h1>

        <p className={`text-sm ${tk.textSecondary}`}>{resolvedMessage}</p>

        {analysisAudioUrl && (
          <div className="w-full space-y-1 rounded-xl border border-border bg-card/80 p-3">
            <p className="text-xs text-muted-foreground">
              {t("viewer.completed.audioLabel")}
            </p>
            <audio
              ref={analysisAudioRef}
              src={analysisAudioUrl}
              controls
              preload="auto"
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
