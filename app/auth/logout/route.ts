import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { urls } from "@/lib/urls";

async function logout(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL(urls.auth.login, request.url), {
    status: 303,
  });
}

export async function GET(request: Request) {
  return logout(request);
}

export async function POST(request: Request) {
  return logout(request);
}
