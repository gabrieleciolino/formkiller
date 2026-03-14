import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { urls } from "@/lib/urls";
import {
  endAdminTrace,
  startAdminTrace,
  traceAdminStep,
} from "@/lib/observability/admin-trace";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });
  const pathname = request.nextUrl.pathname;
  const isDashboardRoute = pathname.startsWith(urls.dashboard.index);
  const isAdminRoute = pathname.startsWith(urls.admin.index);
  const trace = isAdminRoute
    ? startAdminTrace("proxy.updateSession", { pathname })
    : null;
  const finish = (reason: string, extra?: Record<string, unknown>) => {
    endAdminTrace(trace, {
      pathname,
      reason,
      ...extra,
    });
  };

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await traceAdminStep(trace, "auth.getClaims", () =>
    supabase.auth.getClaims(),
  );

  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  const isProtectedRoute = isDashboardRoute || isAdminRoute;

  if (!userId && isProtectedRoute) {
    // no user, potentially respond by redirecting the user to the login page
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = urls.auth.login;
    loginUrl.searchParams.set(
      "redirect_to",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );

    const redirectResponse = NextResponse.redirect(loginUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    finish("redirect_login_no_user");
    return redirectResponse;
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  finish("ok", { userId });
  return supabaseResponse;
}
