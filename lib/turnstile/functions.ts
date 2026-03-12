import "server-only";

import { headers } from "next/headers";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileVerifyResponse = {
  success: boolean;
  action?: string;
  "error-codes"?: string[];
};

export class TurnstileVerificationError extends Error {
  constructor(message = "Turnstile verification failed") {
    super(message);
    this.name = "TurnstileVerificationError";
  }
}

const getClientIp = (requestHeaders: Headers) => {
  const cfConnectingIp = requestHeaders.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;

  const xForwardedFor = requestHeaders.get("x-forwarded-for");
  if (xForwardedFor) {
    const [firstIp] = xForwardedFor.split(",");
    if (firstIp?.trim()) return firstIp.trim();
  }

  const realIp = requestHeaders.get("x-real-ip");
  return realIp?.trim() || undefined;
};

export async function verifyTurnstileToken({
  token,
  expectedAction,
}: {
  token: string;
  expectedAction?: string;
}) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secret) {
    console.log("[turnstile_missing_secret]");
    throw new TurnstileVerificationError("Turnstile is not configured");
  }

  const requestHeaders = await headers();
  const remoteIp = getClientIp(requestHeaders);

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    console.log("[turnstile_verify_request_failed]", { status: response.status });
    throw new TurnstileVerificationError();
  }

  const result = (await response.json()) as TurnstileVerifyResponse;

  if (!result.success) {
    console.log("[turnstile_verify_failed]", {
      errors: result["error-codes"] ?? [],
    });
    throw new TurnstileVerificationError();
  }

  if (expectedAction && result.action && result.action !== expectedAction) {
    console.log("[turnstile_action_mismatch]", {
      expectedAction,
      receivedAction: result.action,
    });
    throw new TurnstileVerificationError("Turnstile action mismatch");
  }
}
