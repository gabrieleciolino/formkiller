"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

const CONSENT_COOKIE_NAME = "cookie_consent";
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

type ConsentValue = "accepted" | "rejected";

function readCookieConsent() {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${CONSENT_COOKIE_NAME}=`));

  if (!cookie) {
    return null;
  }

  const value = decodeURIComponent(cookie.split("=")[1] ?? "");
  return value === "accepted" || value === "rejected" ? value : null;
}

const subscribeToCookieStore: (onStoreChange: () => void) => () => void = () => {
  return () => {};
};

interface CookieBannerProps {
  title: string;
  description: string;
  acceptLabel: string;
  rejectLabel: string;
  privacyPolicyLabel: string;
  privacyPolicyHref: string;
  cookiePolicyLabel: string;
  cookiePolicyHref: string;
}

export default function CookieBanner({
  title,
  description,
  acceptLabel,
  rejectLabel,
  privacyPolicyLabel,
  privacyPolicyHref,
  cookiePolicyLabel,
  cookiePolicyHref,
}: CookieBannerProps) {
  const cookieConsent = useSyncExternalStore(
    subscribeToCookieStore,
    readCookieConsent,
    () => null,
  );
  const [localConsent, setLocalConsent] = useState<ConsentValue | null>(null);
  const consent = localConsent ?? cookieConsent;

  const updateConsent = (value: ConsentValue) => {
    document.cookie = `${CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${CONSENT_MAX_AGE_SECONDS}; samesite=lax`;
    setLocalConsent(value);
  };

  if (consent !== null) {
    return null;
  }

  return (
    <aside className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-muted-foreground">{description}</p>
          <p className="text-xs text-muted-foreground">
            <Link
              href={cookiePolicyHref}
              className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
            >
              {cookiePolicyLabel}
            </Link>
            {" · "}
            <Link
              href={privacyPolicyHref}
              className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
            >
              {privacyPolicyLabel}
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => updateConsent("rejected")}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {rejectLabel}
          </button>
          <button
            type="button"
            onClick={() => updateConsent("accepted")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {acceptLabel}
          </button>
        </div>
      </div>
    </aside>
  );
}
