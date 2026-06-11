"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { getAuthCallbackUrl } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
        shouldCreateUser: true,
      },
    });

    setSubmitting(false);
    setMessage(
      error
        ? "회원가입 인증 메일을 보내지 못했습니다. 이메일을 확인하고 다시 시도해 주세요."
        : "회원가입 인증 메일을 보냈습니다. 인증 후 회사와 브랜드 정보를 입력합니다.",
    );
  }

  return (
    <AuthFrame
      title="Replo를 시작해 보세요."
      description="Google 계정 또는 업무용 이메일로 가입한 뒤 회사 워크스페이스를 만들 수 있습니다."
    >
      <div className="mt-7">
        <GoogleAuthButton label="Google로 회원가입" />
      </div>

      <div className="my-6 flex items-center gap-4 text-xs font-semibold text-slate-400">
        <span className="h-px flex-1 bg-[#E8E6EF]" />
        또는 이메일로 회원가입
        <span className="h-px flex-1 bg-[#E8E6EF]" />
      </div>

      <form onSubmit={handleSignup}>
        <label htmlFor="signup-email" className="block text-sm font-bold text-[#373248]">
          업무용 이메일
        </label>
        <input
          id="signup-email"
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
          {submitting ? "인증 메일 전송 중..." : "이메일로 가입하기"}
        </button>
      </form>

      {message ? (
        <p className="mt-4 rounded-xl bg-[#F7F6FF] px-4 py-3 text-sm leading-6 text-[#5745C9]" role="status">
          {message}
        </p>
      ) : null}

      <p className="mt-7 text-center text-sm text-slate-500">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-bold text-[#5B47E0] hover:text-[#4631C8]">
          로그인
        </Link>
      </p>
    </AuthFrame>
  );
}
