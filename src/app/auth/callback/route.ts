import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { syncProfileAndLegacyMembership } from "@/lib/customers/access";
import { createMetaEventId } from "@/lib/meta/eventIds";
import { sendMetaCapiEvent } from "@/lib/meta/server";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function redirectWithCookies(
  url: string,
  cookiesToSet: CookieToSet[],
  responseHeaders: Record<string, string>,
) {
  const response = NextResponse.redirect(url, 303);

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  Object.entries(responseHeaders).forEach(([name, value]) => {
    response.headers.set(name, value);
  });
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate, max-age=0",
  );

  return response;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/?login=1&error=auth_failed`);
  }

  const cookieStore = await cookies();
  const cookiesToSet: CookieToSet[] = [];
  const responseHeaders: Record<string, string> = {};
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${origin}/?login=1&error=auth_failed`);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(nextCookies, headers) {
        nextCookies.forEach((cookie) => {
          const existingIndex = cookiesToSet.findIndex(
            ({ name }) => name === cookie.name,
          );
          if (existingIndex >= 0) {
            cookiesToSet[existingIndex] = cookie;
          } else {
            cookiesToSet.push(cookie);
          }
        });
        Object.assign(responseHeaders, headers);
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
      cookiesToSet,
      responseHeaders,
    );
  }

  const user = session.user;

  try {
    const customerId = await syncProfileAndLegacyMembership(user);
    const eventId = customerId ? "" : createMetaEventId("complete_registration");
    if (eventId) {
      await sendMetaCapiEvent({
        eventName: "CompleteRegistration",
        eventId,
        eventSourceUrl: `${origin}/auth/callback`,
        userData: { email: user.email },
        customData: { content_name: "google_auth" },
        request,
      });
    }
    return redirectWithCookies(
      `${origin}${customerId ? "/dashboard" : `/onboarding?registered=1&event_id=${encodeURIComponent(eventId)}`}`,
      cookiesToSet,
      responseHeaders,
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
      cookiesToSet,
      responseHeaders,
    );
  }
}
