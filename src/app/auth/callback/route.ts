import { NextResponse } from "next/server";
import { syncProfileAndLegacyMembership } from "@/lib/customers/access";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/?login=1&error=auth_failed`);
  }

  const supabase = await createClient();
  const {
    data: { session },
    error: exchangeError,
  } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError || !session?.user) {
    return NextResponse.redirect(`${origin}/?login=1&error=auth_failed`);
  }

  const user = session.user;

  try {
    const customerId = await syncProfileAndLegacyMembership(user);
    return NextResponse.redirect(`${origin}${customerId ? "/dashboard" : "/onboarding"}`);
  } catch (error) {
    console.error(
      "Failed to initialize authenticated user:",
      error instanceof Error ? error.message : "unknown error",
    );

    // Existing members can continue through RLS even if an admin-only profile
    // synchronization step is temporarily unavailable.
    const { data: membership } = await supabase
      .from("customer_members")
      .select("customer_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    return NextResponse.redirect(
      `${origin}${membership?.customer_id ? "/dashboard" : "/onboarding"}`,
    );
  }
}
