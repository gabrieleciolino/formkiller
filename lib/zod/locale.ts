import { z } from "zod";
import { en, es, it } from "zod/locales";

const ZOD_LOCALES = {
  en,
  es,
  it,
} as const;

type SupportedLocale = keyof typeof ZOD_LOCALES;

function normalizeLocale(locale: string): SupportedLocale {
  const language = locale.toLowerCase().split("-")[0];
  if (language === "it") return "it";
  if (language === "es") return "es";
  return "en";
}

export function setZodLocale(locale: string) {
  const normalizedLocale = normalizeLocale(locale);
  z.config(ZOD_LOCALES[normalizedLocale]());
}
