import type { Metadata } from "next";
import { PlanTiers } from "./PlanTiers";

// Mobile-only ad landing page for Meta/Instagram traffic.
// Designed around a 390px viewport, centered as a mobile column on wider
// screens. Every CTA routes to the existing /contact diagnosis form and
// forwards the current query string (utm_*, fbclid, ...) so paid-traffic
// attribution is preserved end-to-end.

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

// Read per-request so ad-click params (utm_*, fbclid) reach the CTA hrefs
// instead of being frozen into a prerendered static page.
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

// Rebuild the incoming query string (utm_source, utm_campaign, fbclid, ...)
// and append it to the /contact CTA target so ad-click attribution survives.
function buildContactHref(searchParams: SearchParams): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    } else if (typeof value === "string") {
      params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `/contact?${qs}` : "/contact";
}

const styles = `
.ads {
  --brand: #6D5DF6;
  --brand-2: #7A6BFF;
  --brand-deep: #5B47E0;
  --brand-soft: #F1EEFF;
  --ink: #111827;
  --muted: #6B7280;
  --border: #E7E3FF;
  --lavender: #F6F5FF;
  --dark: #1B1830;
  position: relative;
  min-height: 100vh;
  margin: 0 auto;
  max-width: 480px;
  background: #FBFAFF;
  color: var(--ink);
  font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  letter-spacing: -0.02em;
  overflow-x: clip;
  padding-bottom: 112px; /* room for sticky CTA */
}
.ads * { box-sizing: border-box; }
.ads img { max-width: 100%; display: block; }
.ads a { -webkit-tap-highlight-color: transparent; }

.ads-wrap { padding: 0 20px; }

/* ============ Top bar ============ */
.ads-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 20px;
  background: rgba(251, 250, 255, 0.78);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid rgba(231, 227, 255, 0.6);
}
.ads-topbar img { height: 23px; width: auto; }
.ads-toplink {
  font-size: 13px;
  font-weight: 700;
  color: var(--brand-deep);
  text-decoration: none;
  padding: 8px 15px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #fff;
  box-shadow: 0 2px 8px rgba(109, 93, 246, 0.08);
}

/* ============ Shared bits ============ */
.ads-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 700;
  color: var(--brand-deep);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border);
  padding: 8px 15px;
  border-radius: 999px;
  box-shadow: 0 6px 18px rgba(109, 93, 246, 0.12);
}
.ads-badge svg { width: 15px; height: 15px; color: var(--brand); }

.ads-eyebrow {
  font-size: 12.5px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--brand);
  margin: 0 0 11px;
  text-transform: uppercase;
}
.ads-h2 {
  font-size: 24px;
  line-height: 1.4;
  font-weight: 800;
  margin: 0 0 22px;
  letter-spacing: -0.035em;
}
.ads-h2 .hl { color: var(--brand); }
.ads-sub { font-size: 15px; line-height: 1.62; color: var(--muted); margin: 0; }

/* Primary button */
.ads-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  padding: 17px 20px;
  border-radius: 16px;
  font-size: 17px;
  font-weight: 800;
  color: #fff;
  text-decoration: none;
  background: linear-gradient(135deg, var(--brand-2) 0%, var(--brand) 48%, var(--brand-deep) 100%);
  box-shadow: 0 10px 26px rgba(109, 93, 246, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.28);
  border: none;
  letter-spacing: -0.02em;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.ads-cta svg { width: 18px; height: 18px; }
.ads-cta:hover { box-shadow: 0 14px 32px rgba(109, 93, 246, 0.44), inset 0 1px 0 rgba(255, 255, 255, 0.3); }
.ads-cta:active { transform: translateY(1px) scale(0.995); }
.ads-reassure { text-align: center; font-size: 13px; color: var(--muted); margin: 13px 0 0; }

/* Decorative primitives */
.ads-dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(109, 93, 246, 0.13) 1.1px, transparent 1.1px);
  background-size: 18px 18px;
  -webkit-mask-image: radial-gradient(120% 90% at 50% 0%, #000 30%, transparent 72%);
  mask-image: radial-gradient(120% 90% at 50% 0%, #000 30%, transparent 72%);
  pointer-events: none;
}
.ads-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(46px);
  pointer-events: none;
  z-index: 0;
}

/* Floating mini decoration card */
.ads-float {
  position: absolute;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(231, 227, 255, 0.9);
  box-shadow: 0 12px 26px rgba(91, 71, 224, 0.14);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  font-size: 11.5px;
  font-weight: 700;
  color: #4B5563;
  pointer-events: none;
}
.ads-float .ic {
  width: 22px; height: 22px; border-radius: 7px;
  display: grid; place-items: center;
  background: var(--brand-soft); color: var(--brand);
}
.ads-float .ic svg { width: 13px; height: 13px; }

/* ============ 1. Hero ============ */
.ads-hero {
  position: relative;
  overflow: hidden;
  padding: 34px 20px 46px;
  text-align: center;
  background:
    radial-gradient(120% 70% at 50% -6%, rgba(122, 107, 255, 0.20), transparent 62%),
    radial-gradient(90% 50% at 88% 8%, rgba(109, 93, 246, 0.12), transparent 55%),
    linear-gradient(180deg, #F3F0FF 0%, #FBFAFF 100%);
}
.ads-hero .ads-glow.g1 { width: 200px; height: 200px; top: -40px; left: -50px; background: rgba(122, 107, 255, 0.28); }
.ads-hero .ads-glow.g2 { width: 160px; height: 160px; top: 120px; right: -60px; background: rgba(91, 71, 224, 0.18); }
.ads-hero .lines { position: absolute; inset: 0; z-index: 0; opacity: 0.5; pointer-events: none; }
.ads-hero .f1 { top: 96px; left: -14px; }
.ads-hero .f2 { top: 210px; right: -10px; }
.ads-hero-inner { position: relative; z-index: 2; }

.ads-hero h1 {
  font-size: 29px;
  line-height: 1.36;
  font-weight: 800;
  letter-spacing: -0.04em;
  margin: 17px 0 15px;
}
.ads-hero h1 .hl {
  color: var(--brand);
  background: linear-gradient(120deg, var(--brand-2), var(--brand-deep));
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.ads-hero .ads-sub { padding: 0 6px; }

/* Hero price card — dimensional */
.ads-offer {
  position: relative;
  margin: 26px 2px 22px;
  border-radius: 26px;
  padding: 26px 22px 24px;
  background: linear-gradient(165deg, #ffffff 0%, #F4F1FF 100%);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow:
    0 24px 50px rgba(91, 71, 224, 0.22),
    0 2px 0 rgba(255, 255, 255, 0.7) inset,
    0 0 0 1px rgba(109, 93, 246, 0.16);
  overflow: hidden;
}
.ads-offer::before {
  content: "";
  position: absolute; left: 0; right: 0; top: 0; height: 44%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.85), transparent);
  pointer-events: none;
}
.ads-offer::after {
  content: "";
  position: absolute; width: 180px; height: 180px; right: -60px; top: -70px;
  background: radial-gradient(circle, rgba(122, 107, 255, 0.24), transparent 70%);
  pointer-events: none;
}
.ads-offer > * { position: relative; }
.ads-offer .limited {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 800; color: #fff;
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%);
  padding: 6px 15px; border-radius: 999px; margin-bottom: 15px;
  box-shadow: 0 6px 16px rgba(91, 71, 224, 0.32);
}
.ads-offer .limited svg { width: 13px; height: 13px; }
.ads-price { display: flex; align-items: baseline; justify-content: center; gap: 5px; line-height: 1; }
.ads-price .won, .ads-price .unit { font-size: 22px; font-weight: 800; color: var(--ink); }
.ads-price .num {
  font-size: 68px; font-weight: 800; letter-spacing: -0.045em;
  background: linear-gradient(165deg, #8577FF, var(--brand-deep));
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.ads-offer .tags {
  margin-top: 15px; padding-top: 16px;
  border-top: 1px dashed var(--border);
  font-size: 13.5px; font-weight: 700; color: #4B5563;
}
.ads-offer .tags b { color: var(--brand-deep); font-weight: 800; }
.ads-hero .ads-cta { position: relative; z-index: 2; }

/* trust strip */
.ads-trust {
  display: flex; justify-content: center; gap: 14px; flex-wrap: wrap;
  margin: 22px 0 4px; position: relative; z-index: 2;
}
.ads-trust span { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: var(--muted); }
.ads-trust svg { width: 14px; height: 14px; color: var(--brand); }

/* ============ Section frame / rhythm ============ */
.ads-band { position: relative; padding: 48px 20px; }
.ads-band--lav {
  background: linear-gradient(180deg, #F4F1FF 0%, #F7F4FF 100%);
  border-radius: 34px 34px 0 0;
  margin-top: -20px;
}
.ads-band--lav.tail { border-radius: 34px; margin-bottom: 8px; }
.ads-curve-top {
  position: absolute; top: -1px; left: 0; right: 0; height: 34px;
  background: inherit; border-radius: 34px 34px 0 0;
}

/* ============ 2. Problem ============ */
.ads-flood {
  position: relative;
  border-radius: 24px;
  padding: 22px 18px 20px;
  background:
    radial-gradient(120% 80% at 20% 0%, rgba(122, 107, 255, 0.16), transparent 60%),
    linear-gradient(165deg, #26223B 0%, #1B1830 100%);
  box-shadow: 0 20px 44px rgba(27, 24, 48, 0.34);
  overflow: hidden;
}
.ads-flood .fhead {
  display: flex; align-items: center; gap: 8px;
  font-size: 12.5px; font-weight: 800; color: #C9C2FF;
  margin-bottom: 15px;
}
.ads-flood .fhead .pulse {
  width: 8px; height: 8px; border-radius: 50%; background: #FF6B6B;
  box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.6);
  animation: adspulse 1.8s ease-out infinite;
}
@keyframes adspulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.55); }
  100% { box-shadow: 0 0 0 9px rgba(255, 107, 107, 0); }
}
.ads-alerts { display: grid; gap: 9px; }
.ads-alert {
  display: flex; align-items: center; gap: 11px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 13px; padding: 11px 13px;
}
.ads-alert .ai {
  width: 30px; height: 30px; border-radius: 9px; flex: 0 0 auto;
  display: grid; place-items: center;
  background: rgba(122, 107, 255, 0.22); color: #B7ACFF;
}
.ads-alert .ai svg { width: 16px; height: 16px; }
.ads-alert p { margin: 0; font-size: 14px; font-weight: 600; color: #EDEBF7; flex: 1; }
.ads-alert .cnt {
  font-size: 11px; font-weight: 800; color: #fff;
  background: #FF6B6B; border-radius: 999px; padding: 2px 8px; flex: 0 0 auto;
}
.ads-flood .fnote {
  margin: 15px 0 0; font-size: 13px; font-weight: 600; color: #A79FD6;
  display: flex; align-items: center; gap: 7px;
}
.ads-problem-line {
  margin: 22px 2px 0; text-align: center;
  font-size: 20px; line-height: 1.5; font-weight: 800; letter-spacing: -0.03em;
}
.ads-problem-line .hl { color: var(--brand); }

/* ============ 3. Comparison ============ */
.ads-compare { position: relative; display: grid; gap: 16px; }
.ads-col { position: relative; border-radius: 22px; padding: 22px 20px; }
.ads-col h3 { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 800; margin: 0 0 16px; }
.ads-col h3 .pill { margin-left: auto; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; }
.ads-col ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.ads-col li { display: flex; align-items: flex-start; gap: 10px; font-size: 14.5px; font-weight: 600; line-height: 1.4; }
.ads-col li svg { width: 18px; height: 18px; flex: 0 0 auto; margin-top: 1px; }

/* gray paper-stack card */
.ads-col--plain {
  background: #F1F1F4; border: 1px solid #E4E4EA; color: #7B8090;
  box-shadow: 0 8px 20px rgba(17, 24, 39, 0.06);
}
.ads-col--plain::before, .ads-col--plain::after {
  content: ""; position: absolute; inset: 0; border-radius: 22px;
  background: #EDEDF1; border: 1px solid #E4E4EA; z-index: -1;
}
.ads-col--plain::before { transform: rotate(-2.2deg) translateY(4px); }
.ads-col--plain::after { transform: rotate(1.6deg) translateY(3px); }
.ads-col--plain h3 { color: #55596A; }
.ads-col--plain h3 .pill { background: #E0E0E6; color: #6B7280; }
.ads-col--plain li svg { color: #AEB2C0; }

/* clean brand card */
.ads-col--brand {
  background: linear-gradient(165deg, #ffffff 0%, #F3F0FF 100%);
  border: 1.5px solid var(--brand);
  color: #1F2937;
  box-shadow: 0 20px 40px rgba(109, 93, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}
.ads-col--brand h3 { color: var(--brand-deep); }
.ads-col--brand h3 img { height: 17px; width: auto; }
.ads-col--brand h3 .pill { background: var(--brand); color: #fff; }
.ads-col--brand li { font-weight: 700; }
.ads-col--brand li svg { color: var(--brand); }
.ads-col--brand li b { color: var(--brand-deep); }

.ads-vs {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  z-index: 3;
  font-size: 12px; font-weight: 800; color: var(--brand-deep);
  background: #fff; border: 1px solid var(--border);
  width: 42px; height: 42px; border-radius: 50%;
  display: grid; place-items: center;
  box-shadow: 0 10px 22px rgba(91, 71, 224, 0.24);
}

/* ============ 4. Service scope (timeline) ============ */
.ads-flow { position: relative; display: grid; gap: 12px; margin-top: 4px; }
.ads-flow::before {
  content: ""; position: absolute; left: 30px; top: 34px; bottom: 34px;
  width: 2px; background: linear-gradient(180deg, var(--brand), rgba(109, 93, 246, 0.15));
  border-radius: 2px;
}
.ads-step { position: relative; display: flex; gap: 15px; }
.ads-step .node {
  position: relative; z-index: 1; flex: 0 0 auto;
  width: 44px; height: 44px; border-radius: 14px;
  display: grid; place-items: center;
  background: #fff; color: var(--brand);
  border: 1.5px solid var(--border);
  box-shadow: 0 6px 16px rgba(109, 93, 246, 0.12);
}
.ads-step .node svg { width: 22px; height: 22px; }
.ads-step .card {
  flex: 1; min-width: 0;
  background: #fff; border: 1px solid #EEEBFB; border-radius: 16px;
  padding: 14px 16px; box-shadow: 0 6px 16px rgba(17, 24, 39, 0.04);
}
.ads-step .card .row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ads-step .card h4 { margin: 0; font-size: 15.5px; font-weight: 800; }
.ads-step .card p { margin: 4px 0 0; font-size: 13.5px; line-height: 1.45; color: var(--muted); font-weight: 500; }
.ads-step .stepno { font-size: 11px; font-weight: 800; color: var(--brand); background: var(--brand-soft); border-radius: 999px; padding: 2px 8px; }

/* featured first step */
.ads-step.is-primary .node {
  width: 52px; height: 52px; border-radius: 16px;
  background: linear-gradient(160deg, var(--brand-2), var(--brand-deep));
  color: #fff; border: none;
  box-shadow: 0 12px 26px rgba(91, 71, 224, 0.4);
}
.ads-step.is-primary .node svg { width: 26px; height: 26px; }
.ads-step.is-primary .card {
  border: 1.5px solid var(--brand);
  background: linear-gradient(160deg, #ffffff, #F4F1FF);
  box-shadow: 0 16px 34px rgba(109, 93, 246, 0.18);
}
.ads-step.is-primary .card h4 { font-size: 18px; }
.ads-step.is-primary .card p { font-size: 14px; color: #4B5563; font-weight: 600; }
.ads-step.is-primary .badge {
  font-size: 11px; font-weight: 800; color: #fff; background: var(--brand);
  border-radius: 999px; padding: 2px 9px;
}

/* ============ 5. Price includes ============ */
.ads-inccard {
  position: relative;
  border-radius: 24px; padding: 26px 22px;
  background: linear-gradient(165deg, #ffffff 0%, #F5F2FF 100%);
  border: 1px solid var(--border);
  box-shadow: 0 18px 40px rgba(91, 71, 224, 0.14);
  overflow: hidden;
}
.ads-inccard::after {
  content: ""; position: absolute; width: 160px; height: 160px; left: -50px; bottom: -60px;
  background: radial-gradient(circle, rgba(122, 107, 255, 0.16), transparent 70%);
}
.ads-inccard > * { position: relative; }
.ads-inccard .cap {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 800; color: var(--brand-deep);
  background: var(--brand-soft); border: 1px solid var(--border);
  padding: 6px 14px; border-radius: 999px; margin-bottom: 18px;
}
.ads-inc { list-style: none; margin: 0; padding: 0; display: grid; gap: 11px; }
.ads-inc li {
  display: flex; align-items: center; gap: 12px;
  font-size: 15.5px; font-weight: 700; color: #1F2937;
  padding: 12px 14px; border-radius: 13px;
  background: #fff; border: 1px solid #EEEBFB;
}
.ads-inc li .ck {
  width: 26px; height: 26px; border-radius: 8px; flex: 0 0 auto;
  display: grid; place-items: center;
  background: var(--brand-soft); color: var(--brand);
}
.ads-inc li .ck svg { width: 16px; height: 16px; }
.ads-inc li.lead { border-color: var(--brand); background: linear-gradient(120deg, #fff, #F5F2FF); }
.ads-inc li.lead .ck { background: var(--brand); color: #fff; }
.ads-inccard .vol {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12.5px; font-weight: 700; color: var(--muted);
  margin: 0 0 14px;
}
.ads-inccard .vol svg { width: 14px; height: 14px; color: var(--brand); }
.ads-inccard .ads-cta { margin-top: 20px; }
.ads-inccard .note { text-align: center; font-size: 12.5px; color: var(--muted); margin: 12px 0 0; }

/* plan tiers (client toggle) */
.ads-tiers-wrap { margin-top: 14px; }
.ads-more {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 15px; border-radius: 14px;
  background: #fff; border: 1px solid var(--border); color: var(--brand-deep);
  font-size: 15px; font-weight: 800; cursor: pointer; letter-spacing: -0.02em;
  box-shadow: 0 6px 16px rgba(109, 93, 246, 0.08);
  transition: background 0.15s ease;
}
.ads-more:hover { background: var(--brand-soft); }
.ads-more:active { transform: translateY(1px); }
.ads-more svg { width: 18px; height: 18px; transition: transform 0.2s ease; }
.ads-more[aria-expanded="true"] svg { transform: rotate(180deg); }
.ads-tiers { display: grid; gap: 12px; margin-top: 12px; }
.ads-tiers .hint { text-align: center; font-size: 12.5px; color: var(--muted); margin: 2px 0 4px; }
.ads-tier {
  border: 1px solid #EEEBFB; border-radius: 18px; padding: 18px;
  background: #fff; box-shadow: 0 8px 20px rgba(17, 24, 39, 0.05);
}
.ads-tier.pop { border: 1.5px solid var(--brand); background: linear-gradient(165deg, #fff, #F5F2FF); }
.ads-tier .thead { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.ads-tier .tname { display: inline-flex; align-items: center; gap: 7px; font-size: 16px; font-weight: 800; }
.ads-tier .tbadge { font-size: 10.5px; font-weight: 800; color: #fff; background: var(--brand); border-radius: 999px; padding: 3px 8px; }
.ads-tier .tprice { font-size: 18px; font-weight: 800; color: var(--brand-deep); white-space: nowrap; }
.ads-tier .tprice small { font-size: 11.5px; font-weight: 700; color: var(--muted); }
.ads-tier .tvol {
  display: inline-block; font-size: 12.5px; font-weight: 800; color: var(--brand);
  background: var(--brand-soft); padding: 4px 11px; border-radius: 999px; margin-bottom: 14px;
}
.ads-tier ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 9px; }
.ads-tier li { display: flex; align-items: flex-start; gap: 9px; font-size: 13.5px; font-weight: 600; color: #374151; line-height: 1.42; }
.ads-tier li svg { width: 16px; height: 16px; color: var(--brand); flex: 0 0 auto; margin-top: 1px; }
.ads-tier .ads-cta { margin-top: 16px; padding: 13px; font-size: 15px; border-radius: 13px; }

/* ============ 6. Recommended ============ */
.ads-reco { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
.ads-reco .item {
  background: #fff; border: 1px solid #EEEBFB; border-radius: 16px;
  padding: 16px 15px; box-shadow: 0 6px 16px rgba(17, 24, 39, 0.04);
}
.ads-reco .item .chk {
  width: 28px; height: 28px; border-radius: 9px; margin-bottom: 10px;
  display: grid; place-items: center;
  background: var(--brand-soft); color: var(--brand);
}
.ads-reco .item .chk svg { width: 16px; height: 16px; }
.ads-reco .item p { margin: 0; font-size: 14px; font-weight: 700; line-height: 1.4; }

/* ============ 7. Final CTA card ============ */
.ads-final { position: relative; padding: 50px 20px 44px; overflow: hidden; }
.ads-final .ads-glow { width: 220px; height: 220px; top: 10px; left: 50%; transform: translateX(-50%); background: rgba(122, 107, 255, 0.2); }
.ads-finalcard {
  position: relative; z-index: 2;
  border-radius: 26px; padding: 28px 22px;
  background: linear-gradient(165deg, #6E5FF7 0%, #5B47E0 100%);
  color: #fff; text-align: center;
  box-shadow: 0 26px 52px rgba(91, 71, 224, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25);
  overflow: hidden;
}
.ads-finalcard::after {
  content: ""; position: absolute; width: 200px; height: 200px; right: -60px; top: -70px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.18), transparent 70%);
}
.ads-finalcard > * { position: relative; }
.ads-finalcard .fbadge {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12.5px; font-weight: 800;
  background: rgba(255, 255, 255, 0.18); border: 1px solid rgba(255, 255, 255, 0.28);
  padding: 6px 14px; border-radius: 999px; margin-bottom: 16px;
}
.ads-finalcard .fbadge svg { width: 13px; height: 13px; }
.ads-finalcard h2 { font-size: 22px; line-height: 1.45; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 10px; }
.ads-finalcard p { font-size: 14px; line-height: 1.55; opacity: 0.92; margin: 0 0 18px; }
.ads-checklist {
  list-style: none; margin: 0 0 20px; padding: 16px; text-align: left;
  background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px; display: grid; gap: 10px;
}
.ads-checklist li { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 700; }
.ads-checklist li svg { width: 18px; height: 18px; flex: 0 0 auto; opacity: 0.95; }
.ads-finalcard .ads-cta { background: #fff; color: var(--brand-deep); box-shadow: 0 12px 26px rgba(0, 0, 0, 0.22); }
.ads-finalcard .ads-cta:hover { box-shadow: 0 16px 32px rgba(0, 0, 0, 0.28); }
.ads-finalcard .ads-cta svg { color: var(--brand-deep); }
.ads-finalcard .fnote { font-size: 12.5px; opacity: 0.85; margin: 13px 0 0; }

/* ============ Footer ============ */
.ads-footer { text-align: center; padding: 30px 20px 40px; }
.ads-footer img { height: 21px; width: auto; margin: 0 auto 10px; opacity: 0.85; }
.ads-footer p { margin: 0; font-size: 12px; color: #9CA3AF; line-height: 1.7; }

/* ============ Sticky CTA ============ */
.ads-sticky {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 40;
  margin: 0 auto; max-width: 480px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(251, 250, 255, 0), rgba(251, 250, 255, 0.9) 34%, #FBFAFF 100%);
}
.ads-sticky .ads-cta {
  padding: 16px 20px; border-radius: 15px;
  box-shadow: 0 -2px 10px rgba(91, 71, 224, 0.1), 0 14px 30px rgba(109, 93, 246, 0.4);
}

@media (max-width: 400px) {
  .ads-hero h1 { font-size: 26px; }
  .ads-h2 { font-size: 22px; }
  .ads-price .num { font-size: 60px; }
  .ads-problem-line { font-size: 18px; }
}
@media (max-width: 360px) {
  .ads-wrap, .ads-band, .ads-hero, .ads-final { padding-left: 16px; padding-right: 16px; }
}
@media (prefers-reduced-motion: reduce) {
  .ads-flood .fhead .pulse { animation: none; }
  .ads-cta { transition: none; }
}
`;

/* ---------- Inline line icons (stroke = currentColor) ---------- */
const IconSpark = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c.5 4.5 1.8 6.8 6.5 7.5-4.7.7-6 3-6.5 7.5-.5-4.5-1.8-6.8-6.5-7.5C10.2 8.8 11.5 6.5 12 2Z" /><path d="M19 13c.25 2 .8 3 3 3.4-2.2.4-2.75 1.4-3 3.4-.25-2-.8-3-3-3.4 2.2-.4 2.75-1.4 3-3.4Z" opacity="0.55" /></svg>
);
const IconChat = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 9 9 0 0 1-4-1L3 20l1-4.5A8.5 8.5 0 1 1 21 11.5Z" /></svg>
);
const IconTruck = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 16V6a1 1 0 0 0-1-1H2v11h12Z" /><path d="M14 9h4l3 3v4h-7" /><circle cx="6.5" cy="18.5" r="1.8" /><circle cx="17.5" cy="18.5" r="1.8" /></svg>
);
const IconRefund = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h13a4 4 0 0 1 0 8h-6" /><path d="M7 3 3 7l4 4" /><path d="M13 15l-3 3 3 3" opacity="0.9" /></svg>
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
const IconHeadset = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><rect x="2.5" y="13" width="4" height="6" rx="1.5" /><rect x="17.5" y="13" width="4" height="6" rx="1.5" /><path d="M20 19a4 4 0 0 1-4 3h-2" /></svg>
);
const IconArrow = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
const IconCheck = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12.5l5 5 11-11" /></svg>
);
const IconCross = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
);
const IconBolt = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>
);
const IconShield = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" /><path d="M9 12l2 2 4-4" /></svg>
);

// Faint automation-line SVG behind the hero.
const HeroLines = (
  <svg className="lines" viewBox="0 0 390 320" fill="none" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <path d="M-10 60 H120 a16 16 0 0 1 16 16 V150" stroke="#6D5DF6" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.35" />
    <path d="M400 40 H280 a16 16 0 0 0-16 16 V130 a16 16 0 0 1-16 16 H150" stroke="#6D5DF6" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.28" />
    <circle cx="136" cy="150" r="3" fill="#6D5DF6" opacity="0.5" />
    <circle cx="150" cy="146" r="3" fill="#6D5DF6" opacity="0.4" />
    <circle cx="264" cy="56" r="3" fill="#6D5DF6" opacity="0.45" />
  </svg>
);

const flowSteps = [
  { icon: IconHeadset, title: "상담 응대", desc: "전문 상담사가 채팅 · 게시판 · 이메일 문의를 직접 응대합니다.", primary: true },
  { icon: IconRepeat, title: "반복 문의 자동화", desc: "자주 묻는 문의를 자동으로 처리하도록 구조화합니다." },
  { icon: IconFlow, title: "챗봇 구조설계", desc: "고객 여정에 맞춘 챗봇 플로우를 설계합니다." },
  { icon: IconDoc, title: "FAQ · SOP 정리", desc: "응대 기준과 상담 스크립트를 문서로 정리합니다." },
  { icon: IconChart, title: "운영 리포트", desc: "문의 현황과 반복 이슈를 리포트로 제공합니다." },
];

const included = [
  { label: "상담 응대", lead: true },
  { label: "자동화 구조 설계" },
  { label: "챗봇 플로우 설계" },
  { label: "FAQ / SOP 정리" },
  { label: "운영 리포트" },
];

const recommended = [
  "CS 채용은 아직 부담되는 브랜드",
  "대표가 직접 문의를 보는 쇼핑몰",
  "반복 문의가 늘어난 팀",
  "운영 기준이 정리되지 않은 브랜드",
];

export default function AdsLandingPage({ searchParams }: { searchParams: SearchParams }) {
  const contactHref = buildContactHref(searchParams);

  return (
    <main className="ads">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* Top bar */}
      <header className="ads-topbar">
        <img src="/assets/replo-logo.svg" alt="Replo" width={132} height={34} />
        <a className="ads-toplink" href={contactHref}>무료 진단</a>
      </header>

      {/* 1. Hero */}
      <section className="ads-hero" aria-labelledby="ads-hero-title">
        <span className="ads-dots" aria-hidden="true" />
        <span className="ads-glow g1" aria-hidden="true" />
        <span className="ads-glow g2" aria-hidden="true" />
        {HeroLines}
        <div className="ads-float f1" aria-hidden="true"><span className="ic">{IconChat}</span>새 문의 응대중</div>
        <div className="ads-float f2" aria-hidden="true"><span className="ic">{IconBot}</span>자동 처리 98%</div>

        <div className="ads-hero-inner">
          <span className="ads-badge">{IconSpark}리플로 런칭 혜택</span>
          <h1 id="ads-hero-title">
            CS직원 뽑기 전,<br />
            <span className="hl">월 59만원</span>으로<br />
            CS 운영대행부터
          </h1>
          <p className="ads-sub">상담 응대 · 자동화 · 챗봇 구조설계 · 운영 기준 정리까지</p>

          <div className="ads-offer">
            <span className="limited">{IconSpark}7월 한정</span>
            <div className="ads-price">
              <span className="won">월</span>
              <span className="num">59</span>
              <span className="unit">만원</span>
            </div>
            <div className="tags">AI 자동화 · 챗봇 구조설계 · <b>CS 운영대행</b></div>
          </div>

          <a className="ads-cta" href={contactHref}>무료 운영 진단 받기{IconArrow}</a>
          <p className="ads-reassure">상담 후 계약 여부를 결정하셔도 됩니다.</p>

          <div className="ads-trust">
            <span>{IconShield}상담 후 결정</span>
            <span>{IconBolt}바로 운영 시작</span>
            <span>{IconHeadset}전문 상담사 응대</span>
          </div>
        </div>
      </section>

      {/* 2. Problem */}
      <section className="ads-band ads-band--lav" aria-labelledby="ads-problem-title">
        <p className="ads-eyebrow">이런 하루, 익숙하신가요?</p>
        <h2 className="ads-h2" id="ads-problem-title" style={{ marginBottom: 20 }}>
          대표님이 직접 CS를 보고 있다면<br />
          <span className="hl">성장할 시간</span>이 사라집니다.
        </h2>

        <div className="ads-flood">
          <div className="fhead"><span className="pulse" />문의 폭주 · 실시간</div>
          <div className="ads-alerts">
            <div className="ads-alert"><span className="ai">{IconChat}</span><p>교환 문의요</p><span className="cnt">98</span></div>
            <div className="ads-alert"><span className="ai">{IconTruck}</span><p>배송 언제 되나요?</p><span className="cnt">112</span></div>
            <div className="ads-alert"><span className="ai">{IconRefund}</span><p>환불 가능한가요?</p><span className="cnt">76</span></div>
          </div>
          <p className="fnote">{IconRepeat}<span>같은 문의를 매번 대표님이 직접 답변합니다.</span></p>
        </div>

        <p className="ads-problem-line">
          문의에 묶이는 시간만큼,<br />
          <span className="hl">매출을 키울 시간</span>이 줄어듭니다.
        </p>
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
            <h3>직접 채용<span className="pill">부담 ↑</span></h3>
            <ul>
              <li>{IconCross}채용 공고 · 면접</li>
              <li>{IconCross}교육 · 관리</li>
              <li>{IconCross}퇴사 · 공백 리스크</li>
              <li>{IconCross}월 고정비 부담</li>
            </ul>
          </div>
          <div className="ads-col ads-col--brand">
            <h3><img src="/assets/replo-logo.svg" alt="Replo" />CS 운영대행<span className="pill">추천</span></h3>
            <ul>
              <li>{IconCheck}바로 운영 시작</li>
              <li>{IconCheck}상담 응대 포함</li>
              <li>{IconCheck}운영 기준 함께 정리</li>
              <li>{IconCheck}월 단위 유연 운영</li>
              <li>{IconCheck}<b>7월 한정 월 59만원</b></li>
            </ul>
          </div>
          <div className="ads-vs" aria-hidden="true">VS</div>
        </div>
      </section>

      {/* 4. Service scope — operations flow */}
      <section className="ads-band ads-band--lav" aria-labelledby="ads-scope-title">
        <p className="ads-eyebrow">툴이 아니라, 운영대행</p>
        <h2 className="ads-h2" id="ads-scope-title">
          툴만 제공하지 않습니다.<br />
          <span className="hl">CS 운영을 대신</span>합니다.
        </h2>
        <div className="ads-flow">
          {flowSteps.map((s, i) => (
            <div className={`ads-step${s.primary ? " is-primary" : ""}`} key={s.title}>
              <span className="node">{s.icon}</span>
              <div className="card">
                <div className="row">
                  <span className="stepno">STEP {i + 1}</span>
                  <h4>{s.title}</h4>
                  {s.primary && <span className="badge">직접 응대</span>}
                </div>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Price includes */}
      <section className="ads-band" aria-labelledby="ads-price-title">
        <p className="ads-eyebrow">7월 한정 런칭 혜택</p>
        <h2 className="ads-h2" id="ads-price-title">
          <span className="hl">월 59만원</span>에<br />포함되는 것
        </h2>
        <div className="ads-inccard">
          <span className="cap">{IconSpark}7월 한정 · 월 59만원</span>
          <p className="vol">{IconHeadset}월 문의 500건 기준 · 상담 응대 포함</p>
          <ul className="ads-inc">
            {included.map((it) => (
              <li className={it.lead ? "lead" : undefined} key={it.label}>
                <span className="ck">{IconCheck}</span>{it.label}
              </li>
            ))}
          </ul>
          <a className="ads-cta" href={contactHref}>무료 운영 진단 받기{IconArrow}</a>
          <p className="note">상담 후 계약 여부를 결정하셔도 됩니다.</p>
        </div>

        <PlanTiers contactHref={contactHref} />
      </section>

      {/* 6. Recommended */}
      <section className="ads-band ads-band--lav tail" aria-labelledby="ads-reco-title">
        <p className="ads-eyebrow">이런 브랜드에 딱 맞습니다</p>
        <h2 className="ads-h2" id="ads-reco-title">
          이런 브랜드라면<br /><span className="hl">Replo</span>가 맞습니다.
        </h2>
        <div className="ads-reco">
          {recommended.map((r) => (
            <div className="item" key={r}>
              <span className="chk">{IconCheck}</span>
              <p>{r}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Final CTA card */}
      <section className="ads-final" aria-labelledby="ads-final-title">
        <span className="ads-glow" aria-hidden="true" />
        <div className="ads-finalcard">
          <span className="fbadge">{IconSpark}무료 운영 진단</span>
          <h2 id="ads-final-title">지금 CS 운영 상태를<br />무료로 점검해보세요.</h2>
          <p>문의량 · 반복 문의 · 자동화 가능 영역을<br />함께 확인해 드립니다.</p>
          <ul className="ads-checklist">
            <li>{IconCheck}현재 문의량과 응대 부담 진단</li>
            <li>{IconCheck}반복 문의 · 자동화 가능 영역 확인</li>
            <li>{IconCheck}운영 기준 정리 방향 제안</li>
          </ul>
          <a className="ads-cta" href={contactHref}>무료 운영 진단 받기{IconArrow}</a>
          <p className="fnote">상담 후 계약 여부를 결정하셔도 됩니다.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="ads-footer">
        <img src="/assets/replo-logo.svg" alt="Replo" width={132} height={34} />
        <p>커머스 브랜드를 위한 CS 운영대행 서비스<br />© Replo. All rights reserved.</p>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="ads-sticky">
        <a className="ads-cta" href={contactHref}>무료 운영 진단 받기{IconArrow}</a>
      </div>
    </main>
  );
}
