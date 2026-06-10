"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getAuthCallbackUrl } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";

type SignupForm = {
  email: string;
  companyName: string;
  contactName: string;
  phone: string;
  websiteUrl: string;
};

const initialForm: SignupForm = {
  email: "",
  companyName: "",
  contactName: "",
  phone: "",
  websiteUrl: "",
};

export default function SignupPage() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(field: keyof SignupForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: form.email.trim(),
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
        shouldCreateUser: true,
        data: {
          company_name: form.companyName.trim(),
          contact_name: form.contactName.trim(),
          phone: form.phone.trim(),
          website_url: form.websiteUrl.trim(),
        },
      },
    });

    setSubmitting(false);
    if (error) {
      setMessage("회원가입 요청을 처리하지 못했습니다. 입력 정보를 확인하고 다시 시도해 주세요.");
      return;
    }

    setMessage(
      "회원가입 인증 메일을 보냈습니다. 이메일의 인증 링크를 누르면 대시보드로 이동합니다.",
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F6FF] px-6 py-12">
      <form
        onSubmit={handleSignup}
        className="mx-auto w-full max-w-xl rounded-3xl bg-white p-8 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-gray-900">Replo 회원가입</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          계정과 고객 정보를 만든 뒤 이메일 인증 링크를 보내드립니다.
        </p>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-gray-700 sm:col-span-2">
            이메일
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#5B47E0]"
            />
          </label>
          <label className="block text-sm font-semibold text-gray-700">
            회사명
            <input
              required
              autoComplete="organization"
              value={form.companyName}
              onChange={(event) => updateField("companyName", event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#5B47E0]"
            />
          </label>
          <label className="block text-sm font-semibold text-gray-700">
            담당자명
            <input
              required
              autoComplete="name"
              value={form.contactName}
              onChange={(event) => updateField("contactName", event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#5B47E0]"
            />
          </label>
          <label className="block text-sm font-semibold text-gray-700">
            전화번호 또는 연락처
            <input
              required
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#5B47E0]"
            />
          </label>
          <label className="block text-sm font-semibold text-gray-700">
            홈페이지 또는 서비스 URL
            <input
              type="url"
              required
              autoComplete="url"
              placeholder="https://example.com"
              value={form.websiteUrl}
              onChange={(event) => updateField("websiteUrl", event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#5B47E0]"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-7 w-full rounded-xl bg-[#5B47E0] px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "요청 중..." : "이메일 인증하고 가입하기"}
        </button>
        {message ? <p className="mt-4 text-sm leading-6 text-gray-600" role="status">{message}</p> : null}
        <p className="mt-6 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-semibold text-[#5B47E0]">
            로그인
          </Link>
        </p>
      </form>
    </main>
  );
}
