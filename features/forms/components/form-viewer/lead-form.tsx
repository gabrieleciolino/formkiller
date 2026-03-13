"use client";

import { isLikelyInAppBrowser } from "@/features/forms/components/form-viewer/browser-utils";
import { LandingContactTechBackground } from "@/features/forms/components/form-viewer/landing-contact-tech-background";
import type { LeadFormProps } from "@/features/forms/types";
import { createLeadAction } from "@/features/forms/public-actions";
import { createLeadSchema, type CreateLeadType } from "@/features/leads/schema";
import { useZodLocale } from "@/hooks/use-zod-locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function LeadForm({
  sessionId,
  formId,
  getTurnstileToken,
  onSubmitStart,
  onSubmitError,
  onCompleted,
  bgStyle,
  hasBackgroundImage,
  showLandingContactTechBackground,
  overlayClassName,
  isDark,
}: LeadFormProps) {
  const [isPending, startTransition] = useTransition();
  const prefetchedTurnstileTokenRef = useRef<string | null>(null);
  const prefetchTurnstileTokenPromiseRef = useRef<Promise<string | null> | null>(
    null,
  );
  const t = useTranslations();
  const isInAppBrowser = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return isLikelyInAppBrowser(navigator.userAgent);
  }, []);
  const showSecurityCheckError = useCallback(() => {
    toast(
      t(
        isInAppBrowser
          ? "viewer.errors.securityCheckInAppBrowser"
          : "viewer.errors.securityCheck",
      ),
    );
  }, [isInAppBrowser, t]);

  useZodLocale();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateLeadType>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: { sessionId, formId },
  });

  const primeTurnstileToken = useCallback(() => {
    if (prefetchedTurnstileTokenRef.current || prefetchTurnstileTokenPromiseRef.current) {
      return;
    }

    prefetchTurnstileTokenPromiseRef.current = getTurnstileToken()
      .then((token) => {
        prefetchedTurnstileTokenRef.current = token;
        return token;
      })
      .catch(() => null)
      .finally(() => {
        prefetchTurnstileTokenPromiseRef.current = null;
      });
  }, [getTurnstileToken]);

  useEffect(() => {
    primeTurnstileToken();

    return () => {
      prefetchedTurnstileTokenRef.current = null;
      prefetchTurnstileTokenPromiseRef.current = null;
    };
  }, [primeTurnstileToken]);

  const getSubmitTurnstileToken = useCallback(async () => {
    if (prefetchedTurnstileTokenRef.current) {
      const token = prefetchedTurnstileTokenRef.current;
      prefetchedTurnstileTokenRef.current = null;
      return token;
    }

    if (prefetchTurnstileTokenPromiseRef.current) {
      const token = await prefetchTurnstileTokenPromiseRef.current;
      if (token) {
        prefetchedTurnstileTokenRef.current = null;
        return token;
      }
    }

    return getTurnstileToken().catch(() => null);
  }, [getTurnstileToken]);

  const onSubmit = (values: CreateLeadType) => {
    startTransition(async () => {
      let transitionedToCompleted = false;
      const rollbackLeadPhase = () => {
        if (!transitionedToCompleted) return;
        transitionedToCompleted = false;
        onSubmitError();
      };

      try {
        let turnstileToken = await getSubmitTurnstileToken();
        if (!turnstileToken) {
          showSecurityCheckError();
          primeTurnstileToken();
          return;
        }

        onSubmitStart();
        transitionedToCompleted = true;

        let { data, serverError } = await createLeadAction({
          ...values,
          turnstileToken,
        });

        if (serverError === "TURNSTILE_FAILED") {
          turnstileToken = await getTurnstileToken().catch(() => null);

          if (!turnstileToken) {
            rollbackLeadPhase();
            showSecurityCheckError();
            primeTurnstileToken();
            return;
          }

          ({ data, serverError } = await createLeadAction({
            ...values,
            turnstileToken,
          }));
        }

        if (serverError || !data) {
          rollbackLeadPhase();
          if (serverError === "TURNSTILE_FAILED") {
            showSecurityCheckError();
            primeTurnstileToken();
            return;
          }
          throw new Error();
        }

        onCompleted({
          analysisText: data.analysisText ?? null,
          analysisAudioUrl: data.analysisAudioUrl ?? null,
        });
      } catch {
        rollbackLeadPhase();
        toast(t("viewer.leadForm.error"));
        primeTurnstileToken();
      }
    });
  };

  const fields = [
    { key: "name" as const, label: t("viewer.leadForm.name"), type: "text" },
    { key: "email" as const, label: t("viewer.leadForm.email"), type: "email" },
    { key: "phone" as const, label: t("viewer.leadForm.phone"), type: "tel" },
  ];

  return (
    <div
      className={`relative flex h-dvh flex-col items-center justify-center overflow-hidden px-6 ${isDark ? "bg-black text-white" : "bg-white text-foreground"}`}
      style={bgStyle}
    >
      {showLandingContactTechBackground && <LandingContactTechBackground />}

      {hasBackgroundImage && (
        <div className={`absolute inset-0 ${overlayClassName}`} />
      )}

      <div className="relative w-full max-w-md">
        <div
          className={`w-full space-y-4 rounded-2xl p-6 ${isDark ? "bg-black/90" : "bg-white/90"}`}
        >
          <div className="space-y-1">
            <h2 className="text-2xl font-black">
              {t("viewer.leadForm.title")}
            </h2>
            <p
              className={`text-sm ${isDark ? "text-white/40" : "text-foreground/55"}`}
            >
              {t("viewer.leadForm.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {fields.map(({ key, label, type }) => (
              <div key={key} className="space-y-1.5">
                <label
                  className={`text-xs font-medium ${isDark ? "text-white/50" : "text-foreground/65"}`}
                >
                  {label}
                </label>
                <input
                  {...register(key)}
                  type={type}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
                    isDark
                      ? "bg-white/5 text-white placeholder-white/25 focus:bg-white/8"
                      : "bg-background/80 text-foreground placeholder-muted-foreground/70 focus:bg-background"
                  } ${
                    errors[key]
                      ? "border-red-500/50 focus:border-red-500/70"
                      : isDark
                        ? "border-white/10 focus:border-white/30"
                        : "border-border focus:border-foreground/30"
                  }`}
                />
                {errors[key] && (
                  <p className="text-xs text-red-400">{errors[key]?.message}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={isPending}
              className={`mt-2 w-full rounded-2xl py-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 ${
                isDark
                  ? "bg-white text-black"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {isPending
                ? t("viewer.leadForm.loading")
                : t("viewer.leadForm.submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
