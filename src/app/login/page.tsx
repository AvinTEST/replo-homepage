"use client";

import Link from "next/link";
import { useState } from "react";
import { getAuthCallbackUrl } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const authError =
    searchParams?.error === "auth_failed"
      ? "인증 링크가 만료되었거나 올바르지 않습니다. 다시 로그인해 주세요."
      : "";

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
        shouldCreateUser: false,
      },
    });

    if (error) {
      setMessage(
        "등록된 계정으로 로그인할 수 없습니다. 이메일을 확인하거나 회원가입을 진행해 주세요.",
      );
      return;
    }

    setMessage("로그인용 매직 링크를 이메일로 보냈습니다.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7F6FF] px-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-gray-900">Replo 로그인</h1>
        <p className="mt-2 text-sm text-gray-500">
          기존 계정의 이메일을 입력하면 로그인 링크를 보내드립니다.
        </p>
        {authError ? (
          <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {authError}
          </p>
        ) : null}
        <label htmlFor="login-email" className="mt-6 block text-sm font-semibold text-gray-700">
          이메일
        </label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          placeholder="이메일 주소"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#5B47E0]"
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-[#5B47E0] px-4 py-3 font-semibold text-white"
        >
          로그인 링크 받기
        </button>
        {message && (
          <p className="mt-4 text-sm text-gray-600" role="status">{message}</p>
        )}
        <p className="mt-6 text-center text-sm text-gray-500">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="font-semibold text-[#5B47E0]">
            회원가입
          </Link>
        </p>
      </form>
    </main>
  );
}
