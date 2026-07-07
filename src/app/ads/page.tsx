import type { Metadata } from "next";

// Mobile-only ad landing page for Meta/Instagram traffic.
// Designed around a 390px viewport, centered as a mobile column on wider
// screens. All CTAs route to the existing /contact diagnosis form.
// Fully static (no client JS) so it loads instantly for paid traffic.

export const metadata: Metadata = {
  title: "리플로 Replo | CS직원 뽑기 전, 월 59만원 CS 운영대행",
  description:
    "CS직원 뽑기 전, 월 59만원으로 CS 운영대행부터 시작하세요. 상담 응대 · 자동화 · 챗봇 구조설계 · 운영 기준 정리까지 Replo가 대신 설계하고 운영합니다. 7월 한정 · 무료 운영 진단.",
  openGraph: {
    title: "CS직원 뽑기 전, 월 59만원으로 CS 운영대행부터",
    description:
      "상담 응대 · 자동화 · 챗봇 구조설계 · 운영 기준 정리까지. 7월 한정 월 59만원. 무료 운영 진단 받기.",
  },
};

const CONTACT_HREF = "/contact";

const styles = `
.ads {
  --brand: #6D5DF6;
  --brand-deep: #5B47E0;
  --brand-soft: #F3F1FF;
  --ink: #111827;
  --muted: #6B7280;
  --border: #E7E3FF;
  --lavender: #F6F5FF;
  min-height: 100vh;
  margin: 0 auto;
  max-width: 480px;
  background:
    radial-gradient(120% 60% at 50% -10%, rgba(109, 93, 246, 0.14), transparent 60%),
    radial-gradient(90% 40% at 100% 12%, rgba(109, 93, 246, 0.08), transparent 55%),
    var(--lavender);
  color: var(--ink);
  font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  letter-spacing: -0.02em;
  overflow-x: hidden;
  padding-bottom: 108px; /* room for sticky CTA */
}
.ads * { box-sizing: border-box; }
.ads img { max-width: 100%; display: block; }

.ads-wrap { padding: 0 20px; }
.ads section { scroll-margin-top: 24px; }

/* ---------- Top bar ---------- */
.ads-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: rgba(246, 245, 255, 0.82);
  backdrop-filter: saturate(180%) blur(12px);
  -webkit-backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid rgba(231, 227, 255, 0.7);
}
.ads-topbar img { height: 24px; width: auto; }
.ads-topbar .ads-toplink {
  font-size: 13px;
  font-weight: 700;
  color: var(--brand-deep);
  text-decoration: none;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #fff;
}

/* ---------- Shared ---------- */
.ads-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--brand-deep);
  background: #fff;
  border: 1px solid var(--border);
  padding: 7px 14px;
  border-radius: 999px;
  box-shadow: 0 4px 14px rgba(109, 93, 246, 0.08);
}
.ads-badge .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--brand); }

.ads-eyebrow {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0;
  color: var(--brand);
  margin: 0 0 12px;
}
.ads-h2 {
  font-size: 24px;
  line-height: 1.38;
  font-weight: 800;
  margin: 0 0 22px;
  letter-spacing: -0.03em;
}
.ads-h2 .hl { color: var(--brand); }
.ads-sub { font-size: 15px; line-height: 1.6; color: var(--muted); margin: 0; }

/* Primary button */
.ads-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 17px 20px;
  border-radius: 16px;
  font-size: 17px;
  font-weight: 800;
  color: #fff;
  text-decoration: none;
  background: linear-gradient(135deg, #7A6BFF 0%, var(--brand) 45%, var(--brand-deep) 100%);
  box-shadow: 0 10px 24px rgba(109, 93, 246, 0.34);
  border: none;
  letter-spacing: -0.02em;
}
.ads-cta:active { transform: translateY(1px); }
.ads-cta svg { width: 18px; height: 18px; }
.ads-reassure { text-align: center; font-size: 13px; color: var(--muted); margin: 12px 0 0; }

/* ---------- Hero ---------- */
.ads-hero { padding: 30px 20px 40px; text-align: center; }
.ads-hero h1 {
  font-size: 29px;
  line-height: 1.34;
  font-weight: 800;
  letter-spacing: -0.035em;
  margin: 18px 0 16px;
}
.ads-hero h1 .hl { color: var(--brand); }
.ads-hero .ads-sub { padding: 0 4px; }

.ads-offer {
  margin: 26px 0 22px;
  border-radius: 24px;
  padding: 26px 22px;
  background: linear-gradient(160deg, #ffffff 0%, #F6F4FF 100%);
  border: 1px solid var(--border);
  box-shadow: 0 18px 40px rgba(109, 93, 246, 0.16);
  position: relative;
  overflow: hidden;
}
.ads-offer::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(80% 60% at 50% 0%, rgba(109, 93, 246, 0.10), transparent 70%);
  pointer-events: none;
}
.ads-offer .limited {
  display: inline-block;
  font-size: 13px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%);
  padding: 6px 16px;
  border-radius: 999px;
  margin-bottom: 16px;
}
.ads-offer .price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  line-height: 1;
}
.ads-offer .price .won { font-size: 22px; font-weight: 800; color: var(--ink); }
.ads-offer .price .num {
  font-size: 66px;
  font-weight: 800;
  letter-spacing: -0.04em;
  background: linear-gradient(160deg, #7A6BFF, var(--brand-deep));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.ads-offer .price .unit { font-size: 22px; font-weight: 800; color: var(--ink); }
.ads-offer .tags {
  margin-top: 14px;
  padding-top: 16px;
  border-top: 1px dashed var(--border);
  font-size: 14px;
  font-weight: 700;
  color: #4B5563;
}
.ads-offer .tags b { color: var(--brand-deep); font-weight: 800; }

/* ---------- Section frame ---------- */
.ads-band { padding: 44px 20px; }
.ads-band--soft {
  background: linear-gradient(180deg, transparent, rgba(109, 93, 246, 0.05));
}

/* ---------- Problem cards ---------- */
.ads-plist { display: grid; gap: 12px; }
.ads-pcard {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border: 1px solid #EFEDF9;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 6px 18px rgba(17, 24, 39, 0.04);
}
.ads-pcard .ico {
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: var(--brand-soft);
  color: var(--brand);
}
.ads-pcard .ico svg { width: 22px; height: 22px; }
.ads-pcard p { margin: 0; font-size: 15.5px; font-weight: 700; line-height: 1.45; }

/* ---------- Comparison ---------- */
.ads-compare { display: grid; gap: 14px; }
.ads-col {
  border-radius: 20px;
  padding: 22px 20px;
}
.ads-col h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 800;
  margin: 0 0 16px;
}
.ads-col ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 11px; }
.ads-col li { display: flex; align-items: flex-start; gap: 9px; font-size: 15px; font-weight: 600; line-height: 1.45; }
.ads-col li svg { width: 18px; height: 18px; flex: 0 0 auto; margin-top: 1px; }

.ads-col--plain {
  background: #F3F4F6;
  border: 1px solid #E5E7EB;
  color: #6B7280;
}
.ads-col--plain h3 { color: #4B5563; }
.ads-col--plain .pill {
  font-size: 12px; font-weight: 800; color: #6B7280;
  background: #E5E7EB; padding: 4px 10px; border-radius: 999px;
}
.ads-col--plain li svg { color: #9CA3AF; }

.ads-col--brand {
  background: linear-gradient(165deg, #ffffff 0%, #F4F1FF 100%);
  border: 1.5px solid var(--brand);
  color: #1F2937;
  box-shadow: 0 16px 36px rgba(109, 93, 246, 0.18);
}
.ads-col--brand h3 { color: var(--brand-deep); }
.ads-col--brand h3 img { height: 18px; width: auto; }
.ads-col--brand .pill {
  font-size: 12px; font-weight: 800; color: #fff;
  background: var(--brand); padding: 4px 10px; border-radius: 999px;
}
.ads-col--brand li { font-weight: 700; }
.ads-col--brand li svg { color: var(--brand); }
.ads-vs {
  justify-self: center;
  font-size: 13px; font-weight: 800; color: var(--muted);
  background: #fff; border: 1px solid var(--border);
  width: 40px; height: 40px; border-radius: 50%;
  display: grid; place-items: center;
  box-shadow: 0 6px 14px rgba(17,24,39,0.06);
  margin: -4px 0;
}

/* ---------- Service scope ---------- */
.ads-slist { display: grid; gap: 12px; }
.ads-scard {
  display: flex;
  gap: 14px;
  background: #fff;
  border: 1px solid #EFEDF9;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 6px 18px rgba(17, 24, 39, 0.04);
}
.ads-scard.is-primary {
  border: 1.5px solid var(--brand);
  background: linear-gradient(160deg, #ffffff, #F5F3FF);
  box-shadow: 0 12px 28px rgba(109, 93, 246, 0.16);
}
.ads-scard .ico {
  flex: 0 0 auto;
  width: 46px; height: 46px;
  border-radius: 13px;
  display: grid; place-items: center;
  background: var(--brand-soft);
  color: var(--brand);
}
.ads-scard .ico svg { width: 24px; height: 24px; }
.ads-scard .txt { min-width: 0; }
.ads-scard .txt .row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ads-scard .txt h4 { margin: 0; font-size: 16.5px; font-weight: 800; }
.ads-scard .num { font-size: 12px; font-weight: 800; color: var(--brand); background: var(--brand-soft); padding: 2px 8px; border-radius: 999px; }
.ads-scard .txt p { margin: 5px 0 0; font-size: 14px; line-height: 1.5; color: var(--muted); font-weight: 500; }
.ads-scard .badge-first {
  font-size: 11px; font-weight: 800; color: #fff;
  background: var(--brand); padding: 2px 8px; border-radius: 999px;
}

/* ---------- Price / offer card ---------- */
.ads-pricecard {
  border-radius: 26px;
  padding: 30px 24px;
  background: linear-gradient(165deg, #6E5FF7 0%, #5B47E0 100%);
  color: #fff;
  box-shadow: 0 22px 46px rgba(91, 71, 224, 0.34);
  text-align: center;
  position: relative;
  overflow: hidden;
}
.ads-pricecard::after {
  content: "";
  position: absolute;
  width: 220px; height: 220px;
  right: -70px; top: -70px;
  background: radial-gradient(circle, rgba(255,255,255,0.16), transparent 70%);
  border-radius: 50%;
}
.ads-pricecard .limited {
  display: inline-block;
  font-size: 13px; font-weight: 800;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.28);
  padding: 6px 16px; border-radius: 999px; margin-bottom: 16px;
}
.ads-pricecard .price { display: flex; align-items: baseline; justify-content: center; gap: 4px; line-height: 1; }
.ads-pricecard .price .won,
.ads-pricecard .price .unit { font-size: 24px; font-weight: 800; }
.ads-pricecard .price .num { font-size: 70px; font-weight: 800; letter-spacing: -0.04em; }
.ads-pricecard .label { font-size: 15px; font-weight: 700; opacity: 0.92; margin: 8px 0 0; }
.ads-pricecard .inc {
  list-style: none; margin: 22px 0 0; padding: 20px 0 0;
  border-top: 1px solid rgba(255,255,255,0.22);
  display: grid; gap: 12px; text-align: left;
}
.ads-pricecard .inc li { display: flex; align-items: center; gap: 10px; font-size: 15.5px; font-weight: 700; }
.ads-pricecard .inc li svg { width: 20px; height: 20px; flex: 0 0 auto; }
.ads-pricecard .ads-cta {
  margin-top: 24px;
  background: #fff;
  color: var(--brand-deep);
  box-shadow: 0 10px 24px rgba(0,0,0,0.18);
}
.ads-pricecard .ads-cta svg { color: var(--brand-deep); }
.ads-pricecard .note { font-size: 12.5px; opacity: 0.85; margin: 12px 0 0; }

/* ---------- Recommended ---------- */
.ads-reco { display: grid; gap: 11px; }
.ads-reco .item {
  display: flex; align-items: flex-start; gap: 12px;
  background: #fff; border: 1px solid #EFEDF9; border-radius: 16px;
  padding: 16px 18px;
  box-shadow: 0 5px 14px rgba(17,24,39,0.04);
}
.ads-reco .item .chk {
  flex: 0 0 auto; width: 26px; height: 26px; border-radius: 8px;
  display: grid; place-items: center;
  background: var(--brand-soft); color: var(--brand);
}
.ads-reco .item .chk svg { width: 16px; height: 16px; }
.ads-reco .item p { margin: 0; font-size: 15px; font-weight: 700; line-height: 1.45; }

/* ---------- Final CTA ---------- */
.ads-final {
  text-align: center;
  padding: 48px 24px 40px;
  background:
    radial-gradient(90% 60% at 50% 0%, rgba(109, 93, 246, 0.12), transparent 65%);
}
.ads-final .ads-h2 { margin-bottom: 12px; }
.ads-final .ads-sub { margin-bottom: 26px; }
.ads-final .ads-cta { max-width: 340px; margin: 0 auto; }

/* ---------- Footer ---------- */
.ads-footer {
  text-align: center;
  padding: 28px 20px 36px;
  border-top: 1px solid var(--border);
}
.ads-footer img { height: 22px; width: auto; margin: 0 auto 10px; opacity: 0.9; }
.ads-footer p { margin: 0; font-size: 12px; color: #9CA3AF; line-height: 1.7; }

/* ---------- Sticky CTA ---------- */
.ads-sticky {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  z-index: 40;
  margin: 0 auto;
  max-width: 480px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(246,245,255,0), rgba(246,245,255,0.92) 32%, #F6F5FF 100%);
}
.ads-sticky .ads-cta { padding: 16px 20px; border-radius: 15px; }

@media (max-width: 400px) {
  .ads-hero h1 { font-size: 26px; }
  .ads-h2 { font-size: 22px; }
  .ads-offer .price .num { font-size: 58px; }
  .ads-pricecard .price .num { font-size: 62px; }
}
`;

// --- Inline line icons (stroke = currentColor) ---
const IconChat = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 9 9 0 0 1-4-1L3 20l1-4.5A8.5 8.5 0 1 1 21 11.5Z" /></svg>
);
const IconTruck = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 16V6a1 1 0 0 0-1-1H2v11h12Z" /><path d="M14 9h4l3 3v4h-7" /><circle cx="6.5" cy="18.5" r="1.8" /><circle cx="17.5" cy="18.5" r="1.8" /></svg>
);
const IconRepeat = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
);
const IconBot = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 8V4M9 4h6" /><circle cx="9" cy="14" r="1.2" fill="currentColor" stroke="none" /><circle cx="15" cy="14" r="1.2" fill="currentColor" stroke="none" /><path d="M2 13v2M22 13v2" /></svg>
);
const IconFlow = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="5" rx="1.5" /><rect x="3" y="16" width="6" height="5" rx="1.5" /><rect x="15" y="16" width="6" height="5" rx="1.5" /><path d="M12 8v4M12 12H6v4M12 12h6v4" /></svg>
);
const IconDoc = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></svg>
);
const IconChart = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" rx="1" /><rect x="12" y="8" width="3" height="10" rx="1" /><rect x="17" y="4" width="3" height="14" rx="1" /></svg>
);
const IconArrow = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
const IconCheck = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12.5l5 5 11-11" /></svg>
);
const IconCross = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
);
const IconCheckSm = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4 4 10-10" /></svg>
);

const problems = [
  { icon: IconChat, text: "교환/환불 문의가 계속 쌓입니다" },
  { icon: IconTruck, text: "배송 문의에 매일 시간을 뺏깁니다" },
  { icon: IconRepeat, text: "반복 문의인데 매번 직접 답변합니다" },
];

const services = [
  { icon: IconChat, title: "상담 응대", desc: "채팅 · 게시판 · 이메일 문의를 직접 응대합니다.", first: true },
  { icon: IconRepeat, title: "반복 문의 자동화", desc: "자주 묻는 문의를 자동으로 처리할 수 있게 구조화합니다." },
  { icon: IconFlow, title: "챗봇 구조설계", desc: "고객 여정에 맞는 챗봇 플로우를 설계합니다." },
  { icon: IconDoc, title: "운영 기준 정리", desc: "FAQ · SOP · 상담 스크립트를 정리합니다." },
  { icon: IconChart, title: "운영 리포트", desc: "문의 현황과 반복 이슈를 리포트로 제공합니다." },
];

const recommended = [
  "CS 직원을 뽑기엔 아직 부담되는 브랜드",
  "대표가 직접 고객 문의를 처리하는 쇼핑몰",
  "반복 문의가 많아졌지만 운영 기준이 없는 팀",
  "챗봇이나 자동화를 쓰고 싶지만 구조 설계가 어려운 팀",
];

const included = ["상담 응대", "AI 자동화 구조 설계", "챗봇 플로우 설계", "FAQ / SOP 정리", "운영 리포트"];

export default function AdsLandingPage() {
  return (
    <main className="ads">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* Top bar */}
      <header className="ads-topbar">
        <img src="/assets/replo-logo.svg" alt="Replo" width={132} height={34} />
        <a className="ads-toplink" href={CONTACT_HREF}>무료 진단</a>
      </header>

      {/* 1. Hero */}
      <section className="ads-hero" aria-labelledby="ads-hero-title">
        <span className="ads-badge"><span className="dot" />리플로 런칭 혜택</span>
        <h1 id="ads-hero-title">
          CS직원 뽑기 전,<br />
          <span className="hl">월 59만원</span>으로<br />
          CS 운영대행부터
        </h1>
        <p className="ads-sub">
          상담 응대 · 자동화 · 챗봇 구조설계 · 운영 기준 정리까지<br />
          Replo가 CS 운영을 대신 설계하고 운영합니다.
        </p>

        <div className="ads-offer">
          <span className="limited">7월 한정</span>
          <div className="price">
            <span className="won">월</span>
            <span className="num">59</span>
            <span className="unit">만원</span>
          </div>
          <div className="tags">AI 자동화 · 챗봇 구조설계 · <b>CS 운영대행</b></div>
        </div>

        <a className="ads-cta" href={CONTACT_HREF}>무료 운영 진단 받기{IconArrow}</a>
        <p className="ads-reassure">상담 후 계약 여부를 결정하셔도 됩니다.</p>
      </section>

      {/* 2. Problem */}
      <section className="ads-band ads-band--soft" aria-labelledby="ads-problem-title">
        <p className="ads-eyebrow">이런 하루, 익숙하신가요?</p>
        <h2 className="ads-h2" id="ads-problem-title">
          대표님이 직접 CS를 보고 있다면,<br />
          이미 <span className="hl">성장할 시간</span>을 잃고<br />있을 수 있습니다.
        </h2>
        <div className="ads-plist">
          {problems.map((p) => (
            <div className="ads-pcard" key={p.text}>
              <span className="ico">{p.icon}</span>
              <p>{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Hiring comparison */}
      <section className="ads-band" aria-labelledby="ads-compare-title">
        <p className="ads-eyebrow">채용보다 먼저</p>
        <h2 className="ads-h2" id="ads-compare-title">
          CS직원 채용보다 먼저,<br />
          <span className="hl">운영 구조</span>부터 잡아야 합니다.
        </h2>
        <div className="ads-compare">
          <div className="ads-col ads-col--plain">
            <h3>직접 채용 <span className="pill">부담 ↑</span></h3>
            <ul>
              <li>{IconCross}채용 공고 · 면접 필요</li>
              <li>{IconCross}교육 · 관리 필요</li>
              <li>{IconCross}퇴사 · 공백 리스크</li>
              <li>{IconCross}고정비 부담</li>
            </ul>
          </div>
          <div className="ads-vs">VS</div>
          <div className="ads-col ads-col--brand">
            <h3><img src="/assets/replo-logo.svg" alt="Replo" /> CS 운영대행 <span className="pill">추천</span></h3>
            <ul>
              <li>{IconCheck}바로 운영 시작</li>
              <li>{IconCheck}운영 기준 함께 정리</li>
              <li>{IconCheck}월 단위 유연 운영</li>
              <li>{IconCheck}7월 한정 월 59만원</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Service scope */}
      <section className="ads-band ads-band--soft" aria-labelledby="ads-scope-title">
        <p className="ads-eyebrow">Replo가 하는 일</p>
        <h2 className="ads-h2" id="ads-scope-title">
          툴만 제공하지 않습니다.<br />
          <span className="hl">CS 운영을 대신</span>합니다.
        </h2>
        <div className="ads-slist">
          {services.map((s, i) => (
            <div className={`ads-scard${s.first ? " is-primary" : ""}`} key={s.title}>
              <span className="ico">{s.icon}</span>
              <div className="txt">
                <div className="row">
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <h4>{s.title}</h4>
                  {s.first && <span className="badge-first">가장 먼저</span>}
                </div>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Price / offer */}
      <section className="ads-band" aria-labelledby="ads-price-title">
        <p className="ads-eyebrow">7월 한정 런칭 혜택</p>
        <h2 className="ads-h2" id="ads-price-title">
          7월 한정,<br />
          <span className="hl">월 59만원</span>으로<br />
          CS 운영을 시작하세요.
        </h2>
        <div className="ads-pricecard">
          <span className="limited">7월 한정 · 리플로 런칭 혜택</span>
          <div className="price">
            <span className="won">월</span>
            <span className="num">59</span>
            <span className="unit">만원</span>
          </div>
          <p className="label">CS 운영대행 · 월 단위 유연 운영</p>
          <ul className="inc">
            {included.map((item) => (
              <li key={item}>{IconCheckSm}{item}</li>
            ))}
          </ul>
          <a className="ads-cta" href={CONTACT_HREF}>무료 운영 진단 받기{IconArrow}</a>
          <p className="note">상담 후 계약 여부를 결정하셔도 됩니다.</p>
        </div>
      </section>

      {/* 6. Recommended for */}
      <section className="ads-band ads-band--soft" aria-labelledby="ads-reco-title">
        <p className="ads-eyebrow">이런 브랜드에 딱 맞습니다</p>
        <h2 className="ads-h2" id="ads-reco-title">
          이런 브랜드라면 <span className="hl">Replo</span>가 맞습니다.
        </h2>
        <div className="ads-reco">
          {recommended.map((r) => (
            <div className="item" key={r}>
              <span className="chk">{IconCheckSm}</span>
              <p>{r}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Final CTA */}
      <section className="ads-final" aria-labelledby="ads-final-title">
        <span className="ads-badge"><span className="dot" />무료 운영 진단</span>
        <h2 className="ads-h2" id="ads-final-title" style={{ marginTop: 16 }}>
          CS 운영,<br />직접 하지 않아도 됩니다.
        </h2>
        <p className="ads-sub">현재 문의량과 운영 상태를<br />무료로 진단받아보세요.</p>
        <a className="ads-cta" href={CONTACT_HREF}>무료 운영 진단 받기{IconArrow}</a>
        <p className="ads-reassure">부담 없이 상담만 받아보셔도 됩니다.</p>
      </section>

      {/* Footer */}
      <footer className="ads-footer">
        <img src="/assets/replo-logo.svg" alt="Replo" width={132} height={34} />
        <p>커머스 브랜드를 위한 CS 운영대행 서비스<br />© Replo. All rights reserved.</p>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="ads-sticky">
        <a className="ads-cta" href={CONTACT_HREF}>무료 운영 진단 받기{IconArrow}</a>
      </div>
    </main>
  );
}
