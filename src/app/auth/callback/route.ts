import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * This route exchanges the auth code from the Supabase email link for a session.
 * After a successful exchange the user is redirected to the dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // After logging in redirect to the dashboard page
  return NextResponse.redirect(`${origin}/dashboard`);
}