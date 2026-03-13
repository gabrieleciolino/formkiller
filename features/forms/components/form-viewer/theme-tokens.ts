import type { FormViewerThemeTokens } from "@/features/forms/types";

export function getFormViewerThemeTokens(
  isDark: boolean,
): FormViewerThemeTokens {
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
      overlay: "bg-black/20",
      recordIdle:
        "border-white/30 bg-white/80 text-black hover:border-white/50 hover:bg-white/90 hover:text-black",
      recordHint: "text-white",
      reRecord: "rounded-full border border-white/60 bg-white/40 px-3 py-1.5 text-white font-medium hover:bg-white/50",
      textShadow: "[text-shadow:0_1px_6px_rgba(0,0,0,0.9),0_2px_12px_rgba(0,0,0,0.6)]",
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
    overlay: "bg-white/20",
    recordIdle:
      "border-black/30 bg-black/80 text-white hover:border-black/50 hover:bg-black/90 hover:text-white",
    recordHint: "text-black",
    reRecord: "rounded-full border border-black/60 bg-black/40 px-3 py-1.5 text-white font-medium hover:bg-black/50",
    textShadow: "[text-shadow:0_1px_6px_rgba(255,255,255,0.9),0_2px_12px_rgba(255,255,255,0.6)]",
  };
}
