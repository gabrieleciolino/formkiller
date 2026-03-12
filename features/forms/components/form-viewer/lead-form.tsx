"use client";

import type { LeadFormProps } from "@/features/forms/types";
import { createLeadAction } from "@/features/forms/public-actions";
import { createLeadSchema, type CreateLeadType } from "@/features/leads/schema";
import { useZodLocale } from "@/hooks/use-zod-locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function LeadForm({
  sessionId,
  formId,
  onCompleted,
  bgStyle,
  hasBackgroundImage,
  overlayClassName,
  isDark,
}: LeadFormProps) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();

  useZodLocale();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateLeadType>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: { sessionId, formId },
  });

  const onSubmit = (values: CreateLeadType) => {
    startTransition(async () => {
      try {
        const { data, serverError } = await createLeadAction(values);
        if (serverError || !data) throw new Error();
        onCompleted();
      } catch {
        toast(t("viewer.leadForm.error"));
      }
    });
  };

  const fields = [
    { key: "name" as const, label: t("viewer.leadForm.name"), type: "text" },
    { key: "email" as const, label: t("viewer.leadForm.email"), type: "email" },
    { key: "phone" as const, label: t("viewer.leadForm.phone"), type: "tel" },
    { key: "notes" as const, label: t("viewer.leadForm.notes"), type: "text" },
  ];

  return (
    <div
      className="relative flex min-h-dvh flex-col bg-black text-white"
      style={bgStyle}
    >
      {hasBackgroundImage && (
        <div className={`absolute inset-0 ${overlayClassName}`} />
      )}

      <div className="relative flex flex-1 flex-col justify-center px-6 py-10">
        <div className={`mx-auto w-full max-w-md space-y-6 rounded-2xl p-6 ${isDark ? "bg-black/80" : "bg-white/80"}`}>
          <div className="space-y-1">
            <h2 className="text-2xl font-black">{t("viewer.leadForm.title")}</h2>
            <p className="text-sm text-white/40">{t("viewer.leadForm.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {fields.map(({ key, label, type }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">{label}</label>
                <input
                  {...register(key)}
                  type={type}
                  className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors focus:bg-white/8 ${
                    errors[key]
                      ? "border-red-500/50 focus:border-red-500/70"
                      : "border-white/10 focus:border-white/30"
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
              className="mt-2 w-full rounded-2xl bg-white py-4 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {isPending ? t("viewer.leadForm.loading") : t("viewer.leadForm.submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
