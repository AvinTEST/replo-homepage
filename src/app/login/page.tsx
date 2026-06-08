"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const supabase = createClient();

    // Determine where the user should be redirected after login. This uses
    // NEXT_PUBLIC_SITE_URL so that it works both locally and in production.
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("로그인 링크를 이메일로 보냈습니다.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7F6FF] px-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-gray-900">Replo 로그인</h1>
        <p className="mt-2 text-sm text-gray-500">
          등록된 이메일을 입력하면 로그인 링크를 보내드립니다.
        </p>
        <input
          type="email"
          required
          placeholder="이메일 주소"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-6 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#5B47E0]"
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-[#5B47E0] px-4 py-3 font-semibold text-white"
        >
          로그인 링크 받기
        </button>
        {message && (
          <p className="mt-4 text-sm text-gray-600">{message}</p>
        )}
      </form>
    </main>
  );
}