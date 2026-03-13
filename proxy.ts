import { NextResponse, type NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/security/headers";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicFormPageRoute = pathname.startsWith("/form/");
  const isPublicFormApiRoute = pathname.startsWith("/api/form/");
  const isPublicFormRoute = isPublicFormPageRoute || isPublicFormApiRoute;
  const allowSameOriginFraming = isPublicFormPageRoute;

  if (pathname === "/") {
    return applySecurityHeaders(NextResponse.redirect(new URL("/it", request.url)));
  }

  if (isPublicFormRoute) {
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
