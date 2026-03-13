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

  const user = data?.claims;
  const isProtectedRoute = isDashboardRoute || isAdminRoute;

  if (!user && isProtectedRoute) {
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

  if (user && isAdminRoute) {
    const userId = typeof user.sub === "string" ? user.sub : null;

    if (!userId) {
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

      finish("redirect_login_missing_sub");
      return redirectResponse;
    }

    const { data: account, error: accountError } = await traceAdminStep(
      trace,
      "db.accountRole",
      () =>
        supabase
          .from("account")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle(),
      { userId },
    );

    if (accountError || account?.role !== "admin") {
      const redirectResponse = NextResponse.redirect(
        new URL(urls.dashboard.index, request.url),
      );
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
      });

      finish("redirect_dashboard_non_admin", {
        hasError: Boolean(accountError),
        role: account?.role ?? null,
      });
      return redirectResponse;
    }
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

  finish("ok");
  return supabaseResponse;
}
