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

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="onboarding-page">
      <form
        onSubmit={submit}
        className="onboarding-card"
      >
        <span className="onboarding-logo">Replo<sup>+</sup></span>
        <p className="onboarding-step">워크스페이스 설정</p>
        <h1>회사와 첫 브랜드를 등록해 주세요.</h1>
        <p className="onboarding-description">
          이 정보는 마이페이지와 채널 연동의 고객사 기준으로 사용됩니다.
        </p>

        <div className="onboarding-grid">
          {[
            ["companyName", "회사명", "organization", true],
            ["representativeName", "대표 담당자", "name", true],
            ["businessNumber", "사업자등록번호", "off", false],
            ["billingEmail", "세금계산서 이메일", "email", false],
            ["brandName", "첫 브랜드명", "organization", true],
            ["websiteUrl", "브랜드 홈페이지 URL", "url", false],
          ].map(([field, label, autoComplete, required]) => (
            <label key={String(field)}>
              {label}
              <input
                type={field === "billingEmail" ? "email" : field === "websiteUrl" ? "url" : "text"}
                required={Boolean(required)}
                autoComplete={String(autoComplete)}
                value={form[field as keyof OnboardingForm]}
                onChange={(event) =>
                  updateField(field as keyof OnboardingForm, event.target.value)
                }
              />
            </label>
          ))}
        </div>

        {message ? (
          <p className="onboarding-error" role="alert">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="onboarding-submit"
        >
          {submitting ? "생성 중..." : "워크스페이스 만들기"}
        </button>
      </form>
    </main>
  );
}
