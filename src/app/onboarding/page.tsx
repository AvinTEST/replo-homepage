"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackMetaEvent } from "@/lib/meta/client";

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

function normalizeWebsiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const eventId = searchParams.get("event_id");
    if (searchParams.get("registered") !== "1" || !eventId) return;

    void trackMetaEvent("CompleteRegistration", {
      eventId,
      customData: { content_name: "google_auth" },
    }).finally(() => {
      router.replace("/onboarding");
    });
  }, [router, searchParams]);

  function updateField(field: keyof OnboardingForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedWebsiteUrl = normalizeWebsiteUrl(form.websiteUrl);
    setSubmitting(true);
    setMessage("");

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, websiteUrl: normalizedWebsiteUrl }),
    });
    const result = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setSubmitting(false);
      setMessage(result.error || "워크스페이스를 만들지 못했습니다.");
      return;
    }

    await trackMetaEvent("complete_onboarding", {
      customData: {
        content_name: "workspace_onboarding",
        status: "completed",
      },
    });
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
        <h1>회사와 브랜드 정보를 입력해 주세요.</h1>
        <p className="onboarding-description">
          현재 런칭 준비 중입니다. 입력하신 정보는 워크스페이스 설정에 사용됩니다.
        </p>

        <div className="onboarding-grid">
          {[
            ["companyName", "회사명", "organization", true],
            ["representativeName", "대표 담당자", "name", true],
            ["businessNumber", "사업자등록번호", "off", false],
            ["billingEmail", "연락 이메일", "email", false],
            ["brandName", "주요 운영 브랜드명", "organization", true],
            ["websiteUrl", "브랜드 홈페이지 URL", "url", false],
          ].map(([field, label, autoComplete, required]) => {
            const isBrandName = field === "brandName";
            const isWebsiteUrl = field === "websiteUrl";
            return (
            <label key={String(field)}>
              {label}
              <input
                type={field === "billingEmail" ? "email" : isWebsiteUrl ? "text" : "text"}
                required={Boolean(required)}
                autoComplete={String(autoComplete)}
                placeholder={
                  isBrandName
                    ? "예: 밍구네 발바닥"
                    : isWebsiteUrl
                      ? "예: https://mingu.kr"
                      : undefined
                }
                value={form[field as keyof OnboardingForm]}
                onChange={(event) =>
                  updateField(field as keyof OnboardingForm, event.target.value)
                }
              />
              {isBrandName ? (
                <small>우선 운영할 대표 브랜드명을 입력해 주세요.</small>
              ) : null}
              {isWebsiteUrl ? (
                <small>http를 입력하지 않아도 자동으로 https:// 형식으로 저장됩니다.</small>
              ) : null}
            </label>
          );
          })}
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

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="onboarding-page">
          <div className="onboarding-card">
            <span className="onboarding-logo">Replo<sup>+</sup></span>
            <p className="onboarding-step">워크스페이스 설정</p>
            <h1>회사와 브랜드 정보를 입력해 주세요.</h1>
          </div>
        </main>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
