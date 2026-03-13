import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/lib/seo/site-url";

type HomeLocale = "en" | "it" | "es";

const HOME_METADATA_BY_LOCALE: Record<
  HomeLocale,
  { title: string; description: string; path: string; ogLocale: string }
> = {
  en: {
    title:
      "FormKiller - Voice Conversational Forms for Higher Completion Rates",
    description:
      "FormKiller turns static forms into voice-first conversational experiences with STT, AI TTS, multilingual support and built-in lead capture.",
    path: "/",
    ogLocale: "en_US",
  },
  it: {
    title:
      "FormKiller - Form Conversazionali Vocali per Aumentare i Completamenti",
    description:
      "FormKiller trasforma i form statici in esperienze conversazionali vocali con STT, TTS IA, supporto multilingua e raccolta lead integrata.",
    path: "/it",
    ogLocale: "it_IT",
  },
  es: {
    title:
      "FormKiller - Formularios Conversacionales por Voz para Más Conversiones",
    description:
      "FormKiller convierte formularios estáticos en experiencias conversacionales por voz con STT, TTS con IA, soporte multilingüe y captura de leads integrada.",
    path: "/es",
    ogLocale: "es_ES",
  },
};

const HOME_KEYWORDS = [
  "voice forms",
  "conversational forms",
  "lead capture",
  "speech to text forms",
  "text to speech forms",
  "form builder",
  "multilingual forms",
  "customer research forms",
];

export function getHomeMetadata(locale: HomeLocale): Metadata {
  const localized = HOME_METADATA_BY_LOCALE[locale];
  const canonicalUrl = getAbsoluteUrl(localized.path);

  return {
    title: localized.title,
    description: localized.description,
    keywords: HOME_KEYWORDS,
    category: "technology",
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: getAbsoluteUrl("/"),
        it: getAbsoluteUrl("/it"),
        es: getAbsoluteUrl("/es"),
        "x-default": getAbsoluteUrl("/it"),
      },
    },
    openGraph: {
      type: "website",
      siteName: "FormKiller",
      title: localized.title,
      description: localized.description,
      locale: localized.ogLocale,
      url: canonicalUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: localized.title,
      description: localized.description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
