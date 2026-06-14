import { NextResponse } from "next/server";
import { syncProfileAndLegacyMembership } from "@/lib/customers/access";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  try {
    const customerId = await syncProfileAndLegacyMembership(user);
    return NextResponse.redirect(`${origin}${customerId ? "/dashboard" : "/onboarding"}`);
  } catch (error) {
    console.error(
      "Failed to initialize authenticated user:",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }
}
