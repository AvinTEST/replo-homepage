import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { syncProfileAndLegacyMembership } from "@/lib/customers/access";

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

function redirectWithCookies(url: string, pendingCookies: PendingCookie[]) {
  const response = NextResponse.redirect(url, 303);

  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  response.headers.set("Cache-Control", "private, no-store");

  return response;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/?login=1&error=auth_failed`);
  }

  const cookieStore = await cookies();
  const pendingCookies: PendingCookie[] = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${origin}/?login=1&error=auth_failed`);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        pendingCookies.push({ name, value, options });
      },
      remove(name: string, options: CookieOptions) {
        pendingCookies.push({
          name,
          value: "",
          options: { ...options, maxAge: 0 },
        });
      },
    },
  });
  const {
    data: { session },
    error: exchangeError,
  } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError || !session?.user) {
    return redirectWithCookies(
      `${origin}/?login=1&error=auth_failed`,
      pendingCookies,
    );
  }

  const user = session.user;

  try {
    const customerId = await syncProfileAndLegacyMembership(user);
    return redirectWithCookies(
      `${origin}${customerId ? "/dashboard" : "/onboarding"}`,
      pendingCookies,
    );
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

    return redirectWithCookies(
      `${origin}${membership?.customer_id ? "/dashboard" : "/onboarding"}`,
      pendingCookies,
    );
  }
}
