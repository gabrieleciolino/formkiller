import type { FormViewerThemeTokens } from "@/features/forms/types";

export function getFormViewerThemeTokens(isDark: boolean): FormViewerThemeTokens {
  if (isDark) {
    return {
      bg: "bg-black",
      text: "text-white",
      textSecondary: "text-white/40",
      textHint: "text-white/30",
      border: "border-white/10",
      cardIdle:
        "border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10",
      cardSelected: "border-white bg-white text-black",
      cta: "bg-white text-black",
      ctaDisabled: "disabled:opacity-20",
      cursor: "animate-pulse bg-white/50",
      progressActive: "bg-white",
      progressCurrent: "bg-white/50",
      progressInactive: "bg-white/10",
      progressText: "text-white/30",
      muteBtn: "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white",
      overlay: "bg-black/60",
      recordIdle:
        "border-white/10 bg-white/5 text-white/50 hover:border-white/25 hover:bg-white/10 hover:text-white/80",
      recordHint: "text-white/30",
      reRecord: "text-white/25 hover:text-white/50",
    };
  }

  return {
    bg: "bg-white",
    text: "text-black",
    textSecondary: "text-black/40",
    textHint: "text-black/30",
    border: "border-black/10",
    cardIdle:
      "border-black/10 bg-black/5 text-black/70 hover:border-black/25 hover:bg-black/10",
    cardSelected: "border-black bg-black text-white",
    cta: "bg-black text-white",
    ctaDisabled: "disabled:opacity-20",
    cursor: "animate-pulse bg-black/50",
    progressActive: "bg-black",
    progressCurrent: "bg-black/50",
    progressInactive: "bg-black/10",
    progressText: "text-black/30",
    muteBtn: "bg-black/10 text-black/60 hover:bg-black/20 hover:text-black",
    overlay: "bg-white/60",
    recordIdle:
      "border-black/10 bg-black/5 text-black/50 hover:border-black/25 hover:bg-black/10 hover:text-black/80",
    recordHint: "text-black/30",
    reRecord: "text-black/25 hover:text-black/50",
  };
}
