"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type OnboardingForm = {
  companyName: string;
  representativeName: string;
  businessNumber: string;
  billingEmail: string;
  brandName: string;
  websiteUrl: string;
};

const initialForm: OnboardingForm = {
  companyName: "",
  representativeName: "",
  businessNumber: "",
  billingEmail: "",
  brandName: "",
  websiteUrl: "",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(field: keyof OnboardingForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setSubmitting(false);
      setMessage(result.error || "워크스페이스를 만들지 못했습니다.");
      return;
    }

    router.replace("/mypage");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#F7F6FF] px-6 py-12">
      <form
        onSubmit={submit}
        className="mx-auto w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl"
      >
        <p className="text-sm font-bold text-[#5B47E0]">워크스페이스 설정</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">회사와 첫 브랜드를 등록해 주세요.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          이 정보는 마이페이지와 채널 연동의 고객사 기준으로 사용됩니다.
        </p>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          {[
            ["companyName", "회사명", "organization", true],
            ["representativeName", "대표 담당자", "name", true],
            ["businessNumber", "사업자등록번호", "off", false],
            ["billingEmail", "세금계산서 이메일", "email", false],
            ["brandName", "첫 브랜드명", "organization", true],
            ["websiteUrl", "브랜드 홈페이지 URL", "url", false],
          ].map(([field, label, autoComplete, required]) => (
            <label key={String(field)} className="block text-sm font-semibold text-slate-700">
              {label}
              <input
                type={field === "billingEmail" ? "email" : field === "websiteUrl" ? "url" : "text"}
                required={Boolean(required)}
                autoComplete={String(autoComplete)}
                value={form[field as keyof OnboardingForm]}
                onChange={(event) =>
                  updateField(field as keyof OnboardingForm, event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-[#5B47E0]"
              />
            </label>
          ))}
        </div>

        {message ? (
          <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="mt-7 w-full rounded-xl bg-[#5B47E0] px-4 py-3 font-bold text-white disabled:opacity-60"
        >
          {submitting ? "생성 중..." : "워크스페이스 만들기"}
        </button>
      </form>
    </main>
  );
}
