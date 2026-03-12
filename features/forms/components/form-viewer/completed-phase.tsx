"use client";

import type { FormViewerCompletedPhaseProps } from "@/features/forms/types";
import { CheckCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export function CompletedPhase({
  bgStyle,
  endMessage,
  endTitle,
  hasBackgroundImage,
  isDark,
  tk,
}: FormViewerCompletedPhaseProps) {
  const t = useTranslations();
  const resolvedTitle = endTitle?.trim() || t("viewer.completed.title");
  const resolvedMessage = endMessage?.trim() || t("viewer.completed.message");

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

        <p className={`text-sm ${tk.textSecondary}`}>
          {resolvedMessage}
        </p>
      </div>
    </div>
  );
}
