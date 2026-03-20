"use client";

import type { FormViewerWelcomePhaseProps } from "@/features/forms/types";
import { ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export function WelcomePhase({
  bgStyle,
  hasBackgroundImage,
  isDark,
  introTitle,
  introMessage,
  isPending,
  onStart,
  tk,
}: FormViewerWelcomePhaseProps) {
  const t = useTranslations();
  const resolvedTitle = introTitle?.trim();
  const resolvedMessage = introMessage?.trim();

  return (
    <div
      className={`relative flex h-dvh flex-col items-center justify-center overflow-hidden p-6 ${tk.bg} ${tk.text}`}
      style={bgStyle}
    >
      {hasBackgroundImage && (
        <div className={`absolute inset-0 ${tk.overlay}`} />
      )}

      <div
        className={`relative flex w-full max-w-md flex-col items-center gap-8 rounded-2xl p-8 text-center ${isDark ? "bg-black/90" : "bg-white/90"}`}
      >
        {resolvedTitle ? (
          <h1 className="text-5xl font-black tracking-tight">
            {resolvedTitle}
          </h1>
        ) : null}

        {resolvedMessage ? (
          <p
            className={`text-lg leading-relaxed whitespace-pre-line ${tk.textSecondary}`}
          >
            {resolvedMessage}
          </p>
        ) : null}

        <button
          onClick={onStart}
          disabled={isPending}
          className={`mt-2 flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 ${tk.cta}`}
        >
          {isPending ? t("viewer.welcome.loading") : t("viewer.welcome.start")}
          {!isPending && <ChevronRightIcon className="size-4" />}
        </button>
      </div>
    </div>
  );
}
