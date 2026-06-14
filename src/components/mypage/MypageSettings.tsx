"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { IntegrationManagement } from "@/components/mypage/IntegrationManagement";
import { MemberManagement } from "@/components/mypage/MemberManagement";
import { selectablePlans } from "@/lib/billing/plans";
import { createClient } from "@/lib/supabase/client";

type Section = "profile" | "plan" | "billing" | "members" | "integrations";

type Props = {
  tenantId: string;
  canManage: boolean;
  loginEmail: string;
  roleLabel: string;
  customer: {
    companyName: string;
    brandName: string;
    representativeName: string;
    contactName: string;
    email: string;
    phone: string;
    websiteUrl: string;
    businessNumber: string;
    billingEmail: string;
  };
  subscription: {
    planName: string;
    monthlyFee: number;
    includedTickets: number;
    nextBillingDate: string;
  } | null;
  paymentMethod: {
    maskedNumber: string;
    status: string;
  } | null;
};

const menus: Array<{ id: Section; label: string; description: string }> = [
  { id: "profile", label: "고객 정보", description: "회사와 브랜드 정보" },
  { id: "plan", label: "이용 플랜", description: "플랜 등록 및 변경" },
  { id: "billing", label: "결제 및 청구", description: "결제수단 등록" },
  { id: "members", label: "멤버 관리", description: "구성원과 역할" },
  { id: "integrations", label: "연동 채널 관리", description: "외부 채널 연결" },
];

const sectionTitles: Record<Section, [string, string]> = {
  profile: ["고객 정보", "고객사와 브랜드의 기본 정보를 관리합니다."],
  plan: ["이용 플랜", "운영 규모에 맞는 플랜을 등록하거나 변경합니다."],
  billing: ["결제 및 청구", "결제수단 등록 기능은 준비 중입니다."],
  members: ["멤버 관리", "워크스페이스 구성원과 역할을 관리합니다."],
  integrations: ["연동 채널 관리", "브랜드의 외부 상담 채널을 연결합니다."],
};

type ProfileField = keyof Props["customer"];

const profileFields: Array<{
  key: ProfileField;
  label: string;
  required: boolean;
  placeholder: string;
}> = [
  { key: "companyName", label: "회사명", required: true, placeholder: "주식회사 리플로" },
  { key: "brandName", label: "브랜드명", required: true, placeholder: "Replo" },
  { key: "representativeName", label: "대표 담당자", required: true, placeholder: "김리플" },
  { key: "contactName", label: "실무 담당자", required: false, placeholder: "운영 담당자" },
  { key: "email", label: "고객 연락 이메일", required: true, placeholder: "hello@company.com" },
  { key: "phone", label: "연락처", required: false, placeholder: "02-0000-0000" },
  { key: "websiteUrl", label: "웹사이트", required: false, placeholder: "https://example.com" },
  { key: "businessNumber", label: "사업자등록번호", required: false, placeholder: "000-00-00000" },
  { key: "billingEmail", label: "세금계산서 이메일", required: false, placeholder: "billing@company.com" },
];

function won(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function MypageSettings(props: Props) {
  const router = useRouter();
  const [active, setActive] = useState<Section>("profile");
  const [profile, setProfile] = useState(props.customer);
  const [selectedPlan, setSelectedPlan] = useState(props.subscription?.planName ?? "Basic");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);

  const title = sectionTitles[active];
  const signOut = async () => {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  };

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    const response = await fetch("/api/mypage/customer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const result = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    setSaving(false);
    if (!response.ok) setError(result.error || "고객 정보를 저장하지 못했습니다.");
    else {
      setMessage(result.message || "고객 정보를 저장했습니다.");
      router.refresh();
    }
  }

  async function savePlan() {
    setPlanSaving(true);
    setMessage("");
    setError("");
    const response = await fetch("/api/mypage/plan", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: selectedPlan }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    setPlanSaving(false);
    if (!response.ok) setError(result.error || "플랜을 저장하지 못했습니다.");
    else {
      setMessage(result.message || "플랜을 저장했습니다.");
      router.refresh();
    }
  }

  return (
    <div className="mypage-shell">
      <nav className="mypage-rail" aria-label="주요 메뉴">
        <Link href="/" className="mypage-rail-logo" aria-label="Replo 홈">R<sup>+</sup></Link>
        <div className="mypage-rail-links">
          <Link href={`/dashboard/${props.tenantId}`}><b>01</b><span>대시보드</span></Link>
          <Link href={`/dashboard/${props.tenantId}/reports`}><b>02</b><span>리포트</span></Link>
          <Link href={`/dashboard/${props.tenantId}/integrations`}><b>03</b><span>연동</span></Link>
          <Link href="/mypage" className="active"><b>04</b><span>설정</span></Link>
        </div>
        <button type="button" className="mypage-avatar" onClick={() => setActive("profile")}>
          {profile.brandName.slice(0, 1) || "R"}
        </button>
      </nav>

      <aside className="mypage-menu">
        <div className="mypage-menu-head">
          <Link href={`/dashboard/${props.tenantId}`} aria-label="대시보드로 돌아가기">‹</Link>
          <strong>설정</strong>
        </div>
        <div className="mypage-menu-list">
          {menus.map((menu) => (
            <button
              key={menu.id}
              type="button"
              className={active === menu.id ? "active" : ""}
              onClick={() => {
                setActive(menu.id);
                setMessage("");
                setError("");
              }}
            >
              <strong>{menu.label}</strong>
              <span>{menu.description}</span>
            </button>
          ))}
        </div>
        <button type="button" className="mypage-logout" onClick={signOut}>로그아웃</button>
      </aside>

      <main className="mypage-content">
        <header className="mypage-title">
          <p>WORKSPACE SETTINGS</p>
          <h1>{title[0]}</h1>
          <span>{title[1]}</span>
        </header>

        {message ? <p className="mypage-message success" role="status">{message}</p> : null}
        {error ? <p className="mypage-message error" role="alert">{error}</p> : null}

        {active === "profile" ? (
          <form className="mypage-card profile-form" onSubmit={saveProfile}>
            <div className="mypage-card-head">
              <div>
                <h2>기본 정보</h2>
                <p>대시보드와 운영 문서에 표시되는 정보입니다.</p>
              </div>
              <span>{props.roleLabel}</span>
            </div>
            <div className="mypage-form-grid">
              {profileFields.map((field) => (
                <label key={field.key}>
                  <span>{field.label}{field.required ? " *" : ""}</span>
                  <input
                    type={field.key.toLowerCase().includes("email") ? "email" : "text"}
                    required={field.required}
                    placeholder={field.placeholder}
                    value={profile[field.key]}
                    disabled={!props.canManage}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                  />
                </label>
              ))}
              <label>
                <span>로그인 이메일</span>
                <input value={props.loginEmail} disabled readOnly />
                <small>Google 계정 식별자는 이 화면에서 변경할 수 없습니다.</small>
              </label>
            </div>
            <div className="mypage-form-actions">
              <button type="submit" disabled={!props.canManage || saving}>
                {saving ? "저장 중..." : "변경사항 저장"}
              </button>
              {!props.canManage ? <p>owner 또는 admin만 수정할 수 있습니다.</p> : null}
            </div>
          </form>
        ) : null}

        {active === "plan" ? (
          <section className="mypage-card">
            <div className="mypage-card-head">
              <div>
                <h2>플랜 등록</h2>
                <p>선택한 플랜은 대시보드 사용량 기준에도 즉시 반영됩니다.</p>
              </div>
              <span>{props.subscription?.planName ?? "미등록"}</span>
            </div>
            <div className="plan-choice-grid">
              {selectablePlans.map((plan) => (
                <label key={plan.id} className={selectedPlan === plan.id ? "selected" : ""}>
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={selectedPlan === plan.id}
                    disabled={!props.canManage}
                    onChange={() => setSelectedPlan(plan.id)}
                  />
                  <strong>{plan.label}</strong>
                  <b>{won(plan.monthlyFee)} <small>/ 월</small></b>
                  <span>{plan.description}</span>
                </label>
              ))}
            </div>
            <div className="enterprise-row">
              <div><strong>Enterprise</strong><span>월 상담 2,000건 이상 · 별도 협의</span></div>
              <Link href="/contact">문의하기</Link>
            </div>
            <div className="current-plan-summary">
              <div><span>현재 플랜</span><strong>{props.subscription?.planName ?? "미등록"}</strong></div>
              <div><span>월 이용료</span><strong>{props.subscription ? won(props.subscription.monthlyFee) : "-"}</strong></div>
              <div><span>포함 문의량</span><strong>{props.subscription ? `${props.subscription.includedTickets.toLocaleString("ko-KR")}건` : "-"}</strong></div>
              <div><span>다음 결제일</span><strong>{props.subscription?.nextBillingDate || "미정"}</strong></div>
            </div>
            <div className="mypage-form-actions">
              <button type="button" disabled={!props.canManage || planSaving} onClick={savePlan}>
                {planSaving ? "등록 중..." : "선택한 플랜 등록"}
              </button>
            </div>
          </section>
        ) : null}

        {active === "billing" ? (
          <section className="mypage-card billing-card">
            <div className="mypage-card-head">
              <div>
                <h2>결제수단</h2>
                <p>자동 결제를 위한 결제수단 등록 기능을 준비하고 있습니다.</p>
              </div>
              <span>준비 중</span>
            </div>
            <div className="payment-placeholder">
              <div>
                <span>현재 결제수단</span>
                <strong>{props.paymentMethod?.maskedNumber || "등록된 결제수단 없음"}</strong>
                <p>{props.paymentMethod?.status || "결제 기능 오픈 후 등록할 수 있습니다."}</p>
              </div>
              <button type="button" disabled>결제수단 등록</button>
            </div>
          </section>
        ) : null}

        {active === "members" ? <div className="embedded-settings"><MemberManagement /></div> : null}
        {active === "integrations" ? <div className="embedded-settings"><IntegrationManagement /></div> : null}
      </main>
    </div>
  );
}
