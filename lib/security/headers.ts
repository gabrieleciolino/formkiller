import { NextResponse } from "next/server";

interface SecurityHeadersOptions {
  allowSameOriginFraming?: boolean;
}

function getContentSecurityPolicy({
  allowSameOriginFraming = false,
}: SecurityHeadersOptions = {}) {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "media-src 'self' blob: data: https:",
    "connect-src 'self' ws: wss: https://challenges.cloudflare.com https://*.supabase.co",
    "frame-src 'self' https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${allowSameOriginFraming ? "'self'" : "'none'"}`,
  ].join("; ");
}

export function applySecurityHeaders(
  response: NextResponse,
  { allowSameOriginFraming = false }: SecurityHeadersOptions = {},
) {
  response.headers.set(
    "Content-Security-Policy",
    getContentSecurityPolicy({ allowSameOriginFraming }),
  );
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set(
    "X-Frame-Options",
    allowSameOriginFraming ? "SAMEORIGIN" : "DENY",
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), geolocation=(), microphone=(self)",
  );

  return response;
}
