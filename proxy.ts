import { NextResponse, type NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/security/headers";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicFormPageRoute = pathname.startsWith("/form/");
  const isPublicFormApiRoute = pathname.startsWith("/api/form/");
  const isPublicTestPageRoute = pathname.startsWith("/test/");
  const isPublicTestApiRoute = pathname.startsWith("/api/test/");
  const isPublicRoute =
    isPublicFormPageRoute ||
    isPublicFormApiRoute ||
    isPublicTestPageRoute ||
    isPublicTestApiRoute;
  const allowSameOriginFraming = isPublicFormPageRoute || isPublicTestPageRoute;

  if (pathname === "/") {
    return applySecurityHeaders(NextResponse.redirect(new URL("/it", request.url)));
  }

  if (isPublicRoute) {
    return applySecurityHeaders(NextResponse.next({ request }), {
      allowSameOriginFraming,
    });
  }

  const response = await updateSession(request);
  return applySecurityHeaders(response, { allowSameOriginFraming });
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
