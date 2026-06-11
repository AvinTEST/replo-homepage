"use client";

import { useState } from "react";
import { getAuthCallbackUrl } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";

export function GoogleAuthButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleGoogleAuth() {
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthCallbackUrl(),
      },
    });

    if (error) {
      setLoading(false);
      setMessage("Google 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={loading}
        className="flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border border-[#D8D6E3] bg-white px-4 text-[15px] font-bold text-[#29253D] transition hover:border-[#A99FF0] hover:bg-[#FAF9FF] focus:outline-none focus:ring-4 focus:ring-[#5B47E0]/10 disabled:opacity-60"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
          <path fill="#4285F4" d="M21.35 12.22c0-.74-.07-1.45-.19-2.13H12v4.03h5.24a4.48 4.48 0 0 1-1.94 2.94v2.62h3.14c1.84-1.7 2.91-4.2 2.91-7.46Z" />
          <path fill="#34A853" d="M12 21.5c2.62 0 4.82-.87 6.44-2.36l-3.14-2.62c-.87.58-1.98.93-3.3.93-2.53 0-4.68-1.71-5.45-4.01H3.31v2.7A9.73 9.73 0 0 0 12 21.5Z" />
          <path fill="#FBBC05" d="M6.55 13.44A5.86 5.86 0 0 1 6.25 12c0-.5.1-.99.3-1.44v-2.7H3.31A9.51 9.51 0 0 0 2.5 12c0 1.5.36 2.92.81 4.14l3.24-2.7Z" />
          <path fill="#EA4335" d="M12 6.55c1.43 0 2.71.49 3.72 1.45l2.79-2.79A9.35 9.35 0 0 0 12 2.5a9.73 9.73 0 0 0-8.69 5.36l3.24 2.7C7.32 8.26 9.47 6.55 12 6.55Z" />
        </svg>
        {loading ? "Google로 이동 중..." : label}
      </button>
      {message ? (
        <p className="mt-3 text-sm text-rose-700" role="alert">
          {message}
        </p>
      ) : null}
    </>
  );
}
