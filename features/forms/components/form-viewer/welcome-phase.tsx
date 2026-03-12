"use client";

import type { FormViewerWelcomePhaseProps } from "@/features/forms/types";
import { ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export function WelcomePhase({
  bgStyle,
  formName,
  hasBackgroundImage,
  isDark,
  introTitle,
  introMessage,
  isPending,
  onStart,
  questionsCount,
  tk,
}: FormViewerWelcomePhaseProps) {
  const t = useTranslations();
  const resolvedTitle = introTitle?.trim() || t("viewer.welcome.title");
  const resolvedMessage =
    introMessage?.trim() ||
    `${t("viewer.welcome.questionsCount", { count: questionsCount })}\n${t("viewer.welcome.instructions")}`;

  return (
    <div
      className={`relative flex min-h-dvh flex-col items-center justify-center p-6 ${tk.bg} ${tk.text}`}
      style={bgStyle}
    >
      {hasBackgroundImage && <div className={`absolute inset-0 ${tk.overlay}`} />}

      <div className={`relative flex w-full max-w-md flex-col items-center gap-8 rounded-2xl p-8 text-center ${isDark ? "bg-black/80" : "bg-white/80"}`}>
        <p className={`text-xs uppercase tracking-widest ${tk.textHint}`}>{formName}</p>

        <h1 className="text-5xl font-black tracking-tight">
          {resolvedTitle}
        </h1>

        <p className={`text-sm leading-relaxed whitespace-pre-line ${tk.textSecondary}`}>
          {resolvedMessage}
        </p>

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
