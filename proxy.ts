import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname !== "/") {
    return updateSession(request);
  }

  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const primaryLang = acceptLanguage
    .split(",")[0]
    .split(/-|;/)[0]
    .toLowerCase();

  if (primaryLang === "it") {
    return NextResponse.redirect(new URL("/it", request.url));
  }
  if (primaryLang === "es") {
    return NextResponse.redirect(new URL("/es", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
