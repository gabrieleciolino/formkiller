"use client";

import { LandingContactTechBackground } from "@/features/forms/components/form-viewer/landing-contact-tech-background";
import type { FormViewerCompletedPhaseProps } from "@/features/forms/types";
import { CheckCircleIcon, LoaderCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

export function CompletedPhase({
  bgStyle,
  endMessage,
  endTitle,
  analysisText,
  analysisAudioUrl,
  analysisStatus,
  isAnalyzing,
  hasBackgroundImage,
  showLandingContactTechBackground,
  isDark,
  tk,
}: FormViewerCompletedPhaseProps) {
  const t = useTranslations();
  const resolvedTitle = endTitle?.trim() || t("viewer.completed.title");
  const analysisMessage = analysisText?.trim();
  const resolvedMessage = endMessage?.trim() || t("viewer.completed.message");
  const analysisLoadingMessage = t("viewer.completed.analysisLoading");
  const analysisErrorFallbackMessage = t("viewer.completed.analysisErrorFallback");
  const shouldShowAnalysisErrorFallback =
    analysisStatus !== "processing" && !analysisMessage && !analysisAudioUrl;
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
      {showLandingContactTechBackground && <LandingContactTechBackground />}

      {hasBackgroundImage && (
        <div className={`absolute inset-0 ${tk.overlay}`} />
      )}

      {analysisAudioUrl && (
        <audio
          ref={analysisAudioRef}
          src={analysisAudioUrl}
          preload="auto"
          className="hidden"
        />
      )}

      <div
        className={`relative flex w-full max-w-md flex-col items-center gap-6 rounded-2xl p-8 text-center ${isDark ? "bg-black/90" : "bg-white/90"}`}
      >
        <div
          className={`flex size-20 items-center justify-center rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}
        >
          <CheckCircleIcon className="size-10" />
        </div>

        <h1 className="text-4xl font-black">{resolvedTitle}</h1>

        {isAnalyzing && (
          <div className={`flex items-center gap-2 text-sm ${tk.textSecondary}`}>
            <LoaderCircleIcon className="size-4 animate-spin" />
            <span>{analysisLoadingMessage}</span>
          </div>
        )}

        {analysisMessage && (
          <p className={`text-md ${tk.textSecondary}`}>{analysisMessage}</p>
        )}

        {shouldShowAnalysisErrorFallback && (
          <p className={`text-md ${tk.textSecondary}`}>
            {analysisErrorFallbackMessage}
          </p>
        )}

        <p className={`text-sm font-bold ${tk.textSecondary}`}>
          {resolvedMessage}
        </p>
      </div>
    </div>
  );
}
