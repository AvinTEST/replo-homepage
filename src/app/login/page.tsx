"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { getAuthCallbackUrl } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const authError =
    searchParams?.error === "auth_failed"
      ? "인증 링크가 만료되었거나 올바르지 않습니다. 다시 로그인해 주세요."
      : "";

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
        shouldCreateUser: false,
      },
    });

    setSubmitting(false);
    setMessage(
      error
        ? "등록된 계정을 찾을 수 없습니다. 이메일을 확인하거나 회원가입을 진행해 주세요."
        : "로그인 링크를 이메일로 보냈습니다. 받은 편지함을 확인해 주세요.",
    );
  }

  return (
    <AuthFrame
      title="다시 만나서 반갑습니다."
      description="Google 계정 또는 가입한 이메일로 Replo 워크스페이스에 로그인하세요."
    >
      {authError ? (
        <p className="mt-6 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700" role="alert">
          {authError}
        </p>
      ) : null}

      <div className="mt-7">
        <GoogleAuthButton label="Google로 계속하기" />
      </div>

      <div className="my-6 flex items-center gap-4 text-xs font-semibold text-slate-400">
        <span className="h-px flex-1 bg-[#E8E6EF]" />
        또는 이메일로 로그인
        <span className="h-px flex-1 bg-[#E8E6EF]" />
      </div>

      <form onSubmit={handleLogin}>
        <label htmlFor="login-email" className="block text-sm font-bold text-[#373248]">
          이메일
        </label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          placeholder="name@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 h-[52px] w-full rounded-xl border border-[#D8D6E3] bg-white px-4 text-[15px] outline-none transition placeholder:text-slate-300 focus:border-[#5B47E0] focus:ring-4 focus:ring-[#5B47E0]/10"
        />
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 h-[52px] w-full rounded-xl bg-[#5B47E0] px-4 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(91,71,224,0.22)] transition hover:bg-[#4D39D0] focus:outline-none focus:ring-4 focus:ring-[#5B47E0]/20 disabled:opacity-60"
        >
          {submitting ? "로그인 링크 전송 중..." : "이메일 로그인 링크 받기"}
        </button>
      </form>

      {message ? (
        <p className="mt-4 rounded-xl bg-[#F7F6FF] px-4 py-3 text-sm leading-6 text-[#5745C9]" role="status">
          {message}
        </p>
      ) : null}

      <p className="mt-7 text-center text-sm text-slate-500">
        Replo가 처음이신가요?{" "}
        <Link href="/signup" className="font-bold text-[#5B47E0] hover:text-[#4631C8]">
          무료로 시작하기
        </Link>
      </p>
    </AuthFrame>
  );
}
