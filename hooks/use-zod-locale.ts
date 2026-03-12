"use client";

import { setZodLocale } from "@/lib/zod/locale";
import { useLocale } from "next-intl";
import { useEffect } from "react";

export function useZodLocale() {
  const locale = useLocale();

  useEffect(() => {
    setZodLocale(locale);
  }, [locale]);
}
