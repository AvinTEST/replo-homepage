"use client";

import { useState } from "react";
import { homeCopy } from "../../content/homeCopy";

const PATHS: Record<string, string> = {
  arrowRight: "M5 12h14M13 5l7 7-7 7",
  card: "M3 7h18v10H3zM3 10h18M7 14h4",
  chart: "M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-7",
  check: "M5 12.5l4.5 4.5L19 7",
  chevDown: "M5 9l7 7 7-7",
  chevRight: "M9 5l7 7-7 7",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3.5 2",
  cpu: "M7 7h10v10H7zM9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3",
  doc: "M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 16h6",
  gauge: "M12 21a9 9 0 1 0-9-9M12 12l4-3M3 12h2M20 8l-1.5 1",
  headset: "M4 13v-1a8 8 0 0 1 16 0v1M4 13a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2ZM20 13a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2ZM18 19a4 4 0 0 1-4 3h-2",
  inbox: "M3 13l3-9h12l3 9v6H3v-6ZM3 13h5l1 3h6l1-3h5",
  layers: "M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5M3 16.5l9 5 9-5",
  link: "M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1",
  menu: "M4 7h16M4 12h16M4 17h16",
  message: "M4 5h16v11H8l-4 4V5Z",
  refresh: "M20 11a8 8 0 0 0-14-4M4 5v4h4M4 13a8 8 0 0 0 14 4M20 19v-4h-4",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3ZM8.5 12l2.5 2.5L16 9.5",
  sparkles: "M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3ZM19 14l.8 2.2 2.2.8-2.2.8L19 20l-.8-2.2-2.2-.8 2.2-.8L19 14Z",
  star: "M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 17l-5.3 2.6 1.1-6L3.4 9.4l6-.8L12 3Z",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  trending: "M3 17l6-6 4 4 8-8M21 7v5M21 7h-5",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0",
  x: "M6 6l12 12M18 6L6 18",
  zap: "M13 3 4 14h7l-1 7 9-11h-7l1-7Z",
};

function Icon({ name, size = 20, stroke = 1.7 }: { name: string; size?: number; stroke?: number }) {
  const d = PATHS[name] ?? PATHS.check;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.split("M").filter(Boolean).map((seg, index) => (
        <path key={index} d={`M${seg}`} />
      ))}
    </svg>
  );
}

function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className={`logo${onDark ? " on-dark" : ""}`}>
      Replo<sup>+</sup>
    </span>
  );
}

function ButtonLink({
  children,
  href = "/diagnosis",
  variant = "primary",
  size,
  className = "",
  iconRight,
}: {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "ghost";
  size?: "lg" | "sm";
  className?: string;
  iconRight?: string;
}) {
  return (
    <a className={["btn", `btn-${variant}`, size === "lg" ? "btn-lg" : size === "sm" ? "btn-sm" : "", className].filter(Boolean).join(" ")} href={href}>
      {children}
      {iconRight ? <Icon name={iconRight} size={size === "sm" ? 16 : 18} /> : null}
    </a>
  );
}

function MarketingNav() {
  const [menu, setMenu] = useState(false);
  const links = [
    ["check-sec", "진단"],
    ["solution-sec", "서비스"],
    ["process-sec", "프로세스"],
    ["cost-sec", "비용"],
    ["pricing-sec", "요금제"],
    ["faq-sec", "FAQ"],
  ];
  return (
    <header className="mnav">
      <div className="wrap mnav-in">
        <a href="#top" aria-label="Replo source home">
          <Logo />
        </a>
        <nav className="mnav-links" aria-label="주요 메뉴">
          {links.map(([id, label]) => (
            <a key={id} href={`#${id}`}>{label}</a>
          ))}
        </nav>
        <div className="mnav-cta">
          <ButtonLink size="sm">무료 진단 받기</ButtonLink>
          <button className="mnav-burger" type="button" onClick={() => setMenu(true)} aria-label="메뉴 열기">
            <Icon name="menu" size={26} />
          </button>
        </div>
      </div>
      <div className={`msheet${menu ? " show" : ""}`} onClick={() => setMenu(false)}>
        <div className="msheet-panel" onClick={(event) => event.stopPropagation()}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <Logo />
            <button type="button" onClick={() => setMenu(false)} style={{ background: "none", border: 0 }} aria-label="메뉴 닫기">
              <Icon name="x" size={24} />
            </button>
          </div>
          {links.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>{label}</a>
          ))}
          <div className="col gap-10" style={{ marginTop: 18 }}>
            <ButtonLink>무료 진단 받기</ButtonLink>
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-bg">
        <div className="hero-grid" />
        <div className="hero-glow" style={{ top: -220, left: "50%", transform: "translateX(-50%)" }} />
      </div>
      <div className="wrap">
        <div className="hero-pitch no-art">
          <span className="chip"><Icon name="sparkles" size={15} /> {homeCopy.hero.eyebrow}</span>
          <h1 className="t-display">
            {homeCopy.hero.title[0]}<br />
            <span className="hero-grad">{homeCopy.hero.title[1]}</span>
          </h1>
          <p className="t-lead lead">{homeCopy.hero.description[0]}<br />{homeCopy.hero.description[1]}</p>
          <div className="cta-row">
            <ButtonLink size="lg" iconRight="arrowRight">{homeCopy.hero.primaryCta}</ButtonLink>
            <ButtonLink href="#solution-sec" size="lg" variant="ghost">{homeCopy.hero.secondaryCta}</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

const CHECKS = [
  ["refresh", homeCopy.checklist.items[0]],
  ["inbox", homeCopy.checklist.items[1]],
  ["doc", homeCopy.checklist.items[2]],
  ["shield", homeCopy.checklist.items[3]],
  ["chart", homeCopy.checklist.items[4]],
] as const;

function ChecklistSection() {
  const [on, setOn] = useState<Record<number, boolean>>({});
  const count = Object.values(on).filter(Boolean).length;
  const result = homeCopy.checklist.cta;

  return (
    <section className="sec" id="check-sec">
      <div className="deco"><div className="deco-dots" /></div>
      <div className="wrap">
        <div className="sec-head sec-center">
          <span className="eyebrow-pill">Self-Check</span>
          <h2 className="t-h1">{homeCopy.checklist.title}</h2>
          <p className="t-lead" style={{ marginTop: 16 }}>{homeCopy.checklist.bottom}</p>
        </div>
        <div className="check-list">
          {CHECKS.map(([icon, title], index) => (
            <button type="button" className={`check-item${on[index] ? " on" : ""}`} key={title} onClick={() => setOn((current) => ({ ...current, [index]: !current[index] }))}>
              <span className="check-box"><Icon name="check" size={15} stroke={2.6} /></span>
              <span className="check-ic"><Icon name={icon} size={20} /></span>
              <span className="check-body">
                <span className="check-t">{title}</span>
                <span className="check-q" />
              </span>
            </button>
          ))}
        </div>
        <div className={`check-result${count > 0 ? " active" : ""}`}><a href="/diagnosis">{result}</a></div>
      </div>
    </section>
  );
}

function CauseSection() {
  return (
    <section className="sec-tight" style={{ background: "var(--bg)" }} id="cause-sec">
      <div className="deco"><div className="orb orb-violet-soft" style={{ width: 420, height: 420, top: -120, right: -140 }} /></div>
      <div className="wrap">
        <div className="sec-head sec-center">
          <span className="eyebrow-pill">Root Cause</span>
          <h2 className="t-h1">{homeCopy.problem.title[0]}<br />{homeCopy.problem.title[1]}</h2>
          <p className="t-lead" style={{ marginTop: 16 }}>{homeCopy.problem.introduction[0]}<br />{homeCopy.problem.introduction[1]}<br />{homeCopy.problem.introduction[2]}</p>
        </div>
        <div className="shift-row">
          <div className="shift-card wrong">
            <div className="shift-label">흔한 진단</div>
            <div className="shift-headline">“사람이 부족해서 그렇다”</div>
            <p className="shift-desc">{homeCopy.problem.structureProblem[0]}<br />{homeCopy.problem.structureProblem[1]}</p>
          </div>
          <div className="shift-arrow"><div className="ring"><Icon name="arrowRight" size={20} /></div></div>
          <div className="shift-card right">
            <div className="shift-label">진짜 원인</div>
            <div className="shift-headline">운영 구조가 없는 것</div>
            <p className="shift-desc">{homeCopy.problem.conclusion}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const URGENCY = [
  ["clock", "24h", "고객 기대 수준이 높아졌습니다", "24시간 이내 응답이 기본이 됐습니다. 느린 응대는 곧 이탈과 낮은 평점으로 이어집니다."],
  ["trending", "시즌 ↑", "문의량은 계속 증가합니다", "브랜드가 성장할수록 CS 부담은 비례해 커집니다. 사람만 늘리는 방식은 한계가 있습니다."],
  ["card", "3,600만+", "인건비는 계속 오릅니다", "상담원 1명 총 고용비용은 연 3,600만 원 이상. 채용을 늘릴수록 고정비 부담이 커집니다."],
  ["user", "96%", "이탈은 조용히 일어납니다", "불만 고객의 96%는 아무 말 없이 떠납니다. 보이지 않는 손실이 매출을 갉아먹습니다."],
] as const;

function WhyNowSection() {
  return (
    <section className="sec" id="whynow-sec">
      <div className="deco"><div className="deco-grid mask-center" /><div className="orb orb-rose" style={{ width: 360, height: 360, bottom: -120, left: -100 }} /></div>
      <div className="wrap">
        <div className="sec-head sec-center">
          <span className="eyebrow-pill">Why Now</span>
          <h2 className="t-h1">운영 구조가 없으면<br />비용은 계속 커집니다</h2>
        </div>
        <div className="urg-grid">
          {URGENCY.map(([icon, stat, title, description]) => (
            <div className="urg-card" key={title}>
              <div className="urg-ic"><Icon name={icon} size={22} /></div>
              <div className="urg-stat">{stat}</div>
              <h4>{title}</h4>
              <p>{description}</p>
            </div>
          ))}
        </div>
        <p className="urg-foot">문의량은 늘어나고, 상담원은 부족해지고, 인건비는 오릅니다.<br /><b>지금 운영 구조를 갖추는 것이 가장 확실한 비용 절감입니다.</b></p>
      </div>
    </section>
  );
}

const SOL_LEFT = [
  ["cpu", "AI 자동화", "반복 문의는 AI가 1차 응대·분류"],
  ["headset", "상담 운영", "콜·채팅·게시판·이메일 통합 응대"],
  ["doc", "SOP 설계", "응대 기준·스크립트를 표준화"],
] as const;
const SOL_RIGHT = [
  ["shield", "QA 관리", "응대 품질을 일정하게 모니터링"],
  ["target", "VOC 분석", "문의 데이터에서 개선점 도출"],
  ["chart", "운영 리포트", "월간 인사이트로 운영 개선"],
] as const;

function SolCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="sol-card">
      <div className="si"><Icon name={icon} size={20} /></div>
      <div><h4>{title}</h4><p>{description}</p></div>
    </div>
  );
}

function SolutionSection() {
  return (
    <section className="sec-tight" style={{ background: "var(--bg)" }} id="solution-sec">
      <div className="deco"><div className="deco-grid mask-center" /><div className="orb orb-violet" style={{ width: 420, height: 420, top: "42%", left: "50%", transform: "translate(-50%,-30%)" }} /></div>
      <div className="wrap">
        <div className="sec-head sec-center">
          <span className="eyebrow-pill">Solution</span>
          <h2 className="t-h1">{homeCopy.service.title}</h2>
          <p className="t-lead" style={{ marginTop: 16 }}>{homeCopy.service.description[0]}<br />{homeCopy.service.description[1]}</p>
        </div>
        <div className="sol-bento">
          <div className="sol-col">{SOL_LEFT.map(([icon, title, description]) => <SolCard key={title} icon={icon} title={title} description={description} />)}</div>
          <div className="sol-core">
            <span className="sc-ring" style={{ width: 220, height: 220 }} />
            <span className="sc-ring" style={{ width: 300, height: 300 }} />
            <span className="sc-badge"><Icon name="sparkles" size={14} /> CS 운영 구독</span>
            <div className="sc-name">Replo<sup>+</sup></div>
            <p className="sc-desc">사람 · AI · 운영 기준을 하나로 묶어, 누가 맡아도 흔들리지 않는 운영 시스템</p>
          </div>
          <div className="sol-col">{SOL_RIGHT.map(([icon, title, description]) => <SolCard key={title} icon={icon} title={title} description={description} />)}</div>
        </div>
      </div>
    </section>
  );
}

const APPROACH = [
  ["상담 인력 투입 중심", "문의 구조 진단 후 운영 설계"],
  ["매뉴얼이 없으면 그대로 응대", "상세페이지·정책·FAQ 기반 상담 가이드 제작"],
  ["문의가 늘면 비용 증가", "반복 문의를 줄이는 구조 개선"],
  ["월 처리 건수 중심 보고", "문의 유형·반복 이슈·개선 포인트 리포트"],
  ["단순 응대 대행", "상담 운영·자동화·VOC 정리까지 포함"],
] as const;

function ApproachSection() {
  return (
    <section className="sec" id="approach-sec">
      <div className="deco"><div className="deco-grid mask-top" /></div>
      <div className="wrap">
        <div className="sec-head sec-center" style={{ maxWidth: 820 }}>
          <span className="eyebrow-pill">Why Different</span>
          <h2 className="t-h1">Replo는 상담을 대신 받는 회사가 아니라,<br />반복 문의가 줄어드는 <span className="hero-grad">CS 구조를 설계</span>합니다</h2>
        </div>
        <div className="appr">
          <div className="appr-head">
            <div className="appr-hc old">기존 CS 외주</div>
            <div className="appr-hc replo"><Logo /></div>
          </div>
          {APPROACH.map(([oldWay, reploWay]) => (
            <div className="appr-row" key={oldWay}>
              <div className="appr-cell old"><span className="appr-mk x"><Icon name="x" size={13} stroke={2.4} /></span>{oldWay}</div>
              <div className="appr-cell replo"><span className="appr-mk ok"><Icon name="check" size={13} stroke={2.6} /></span>{reploWay}</div>
            </div>
          ))}
        </div>
        <p className="appr-foot">단순 콜센터 대행이 아니라, <b>고객센터 운영 구조 자체</b>를 설계합니다.</p>
      </div>
    </section>
  );
}

const STEPS = [
  ["link", "URL 제출", "홈페이지 또는 상세페이지 링크를 전달합니다."],
  ["message", "정책 인터뷰", "교환·반품·배송 등 핵심 정책을 함께 정리합니다."],
  ["doc", "운영 기준 설계", "SOP·FAQ·응대 스크립트를 Replo가 설계합니다."],
  ["headset", "운영 시작", "계약 후 2주 내 실제 상담 운영을 시작합니다."],
  ["chart", "VOC 리포트", "운영 데이터로 월간 인사이트를 제공합니다."],
] as const;

function ProcessSection() {
  return (
    <section className="sec-tight" id="process-sec">
      <div className="wrap">
        <div className="sec-head sec-center">
          <span className="eyebrow-pill">How It Works</span>
          <h2 className="t-h1">{homeCopy.onboarding.title}</h2>
          <p className="t-lead" style={{ marginTop: 16 }}>{homeCopy.onboarding.description[0]}<br />{homeCopy.onboarding.description[1]}</p>
        </div>
        <div className="proc-row">
          {STEPS.map(([icon, title, description], index) => (
            <div className="proc-step" key={title}>
              <div className="proc-top">
                <span className="proc-no">STEP {String(index + 1).padStart(2, "0")}</span>
                <div className="proc-ic"><Icon name={icon} size={20} /></div>
              </div>
              <h4>{title}</h4>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const COST_ROWS = [
  ["기본 인건비 / 월 구독료", "상담원 연봉 약 3,000만 ÷ 12", "250만 원", "99만 원", false],
  ["4대보험 (사업주 부담)", "약 10~11%", "27만 원", "0원", true],
  ["채용·교육비", "채용비·온보딩 교육", "15만 원", "0원", true],
  ["복리후생·운영 간접비", "식대·장비·좌석·관리", "18만 원", "0원", true],
  ["SOP·QA·리포트·자동화", "운영 시스템 전반", "별도 구축 필요", "구독에 포함", true],
] as const;

function CostSection() {
  return (
    <section className="sec-tight" style={{ background: "var(--bg)" }} id="cost-sec">
      <div className="deco"><div className="deco-grid mask-top" /></div>
      <div className="wrap">
        <div className="sec-head sec-center" style={{ maxWidth: 840 }}>
          <span className="eyebrow-pill">Cost</span>
          <h2 className="t-h1">상담원 1명 채용 비용으로<br />운영 시스템 전체를 구축합니다</h2>
          <p className="t-lead" style={{ marginTop: 16 }}>사람 1명을 채용하는 대신, 채용·교육·QA·리포트·AI 자동화까지 고객센터 운영에 필요한 모든 것을 갖출 수 있습니다.</p>
        </div>

        <div className="cost1-wrap">
          <div className="cost1-scroll">
            <table className="cost1">
              <thead>
                <tr>
                  <th className="c1-item">항목</th>
                  <th className="c1-hire"><span className="c1-dot" style={{ background: "var(--red)" }} />직접 채용 <small>(월)</small></th>
                  <th className="c1-replo">Replo Basic <small>(월)</small></th>
                </tr>
              </thead>
              <tbody>
                {COST_ROWS.map(([item, sub, hire, replo, free]) => (
                  <tr key={item}>
                    <td className="c1-item"><b>{item}</b><small>{sub}</small></td>
                    <td className="c1-hireval">{hire}</td>
                    <td className={`c1-reploval${free ? " free" : ""}`}>{replo}</td>
                  </tr>
                ))}
                <tr className="c1-total">
                  <td className="c1-item">월 합계</td>
                  <td className="c1-hireval">약 310만 원</td>
                  <td className="c1-reploval"><span className="c1-price">99만 원</span><span className="c1-badge">약 68% 저렴 ↓</span></td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td className="c1-item">연 환산</td>
                  <td className="c1-hireval">3,720만 원</td>
                  <td className="c1-reploval"><span className="c1-save">매년 2,532만 원 절약</span></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <p className="cost-note"><strong>산출 기준</strong> · 인건비는 직무·지역·연차에 따라 달라질 수 있으며, 위 금액은 일반적인 시장 단가를 바탕으로 한 추정치입니다.</p>
      </div>
    </section>
  );
}

const XFORM = [
  ["담당자 1명에게 운영이 묶임", "운영 기준이 시스템에 남음"],
  ["같은 질문에 매일 같은 답 반복", "반복 문의는 자동으로 처리"],
  ["사람마다 다른 응대 품질", "QA로 일정한 응대 품질"],
  ["데이터 없이 감으로 운영", "월간 리포트로 개선점 발견"],
  ["문의 늘면 채용으로만 버팀", "채용 없이 시스템으로 확장"],
] as const;

function ImpactSection() {
  return (
    <section className="sec-tight" style={{ background: "var(--bg)" }} id="impact-sec">
      <div className="deco"><div className="orb orb-violet-soft" style={{ width: 420, height: 420, top: -140, left: "50%", transform: "translateX(-50%)" }} /></div>
      <div className="wrap">
        <div className="sec-head sec-center">
          <span className="eyebrow-pill">Impact</span>
          <h2 className="t-h1">사람에 기대던 운영이<br />시스템으로 바뀝니다</h2>
          <p className="t-lead" style={{ marginTop: 16 }}>담당자 한 명에게 묶여 있던 고객센터가, 누가 맡아도 흔들리지 않는 구조로 바뀝니다.</p>
        </div>
        <div className="xform">
          <div className="xform-head"><span className="xh-before">Replo 도입 전</span><span /><span className="xh-after">Replo 도입 후</span></div>
          {XFORM.map(([before, after]) => (
            <div className="xrow" key={before}>
              <div className="xcell before"><span className="xic"><Icon name="x" size={15} stroke={2.4} /></span>{before}</div>
              <div className="xarrow"><Icon name="arrowRight" size={20} /></div>
              <div className="xcell after"><span className="xic"><Icon name="check" size={15} stroke={2.6} /></span>{after}</div>
            </div>
          ))}
        </div>
        <div className="impact-result"><p>결국 <strong>고객센터가 비용 센터에서 성장 자산으로 바뀝니다.</strong></p></div>
      </div>
    </section>
  );
}

const VALUES = [
  ["layers", "사람·AI·시스템을 하나로", "상담 인력, AI 자동화, 운영 기준을 한 팀이 통합해 운영합니다. 따로 붙이지 않아도 됩니다."],
  ["gauge", "데이터로 증명하는 개선", "모든 문의가 데이터로 쌓여, 무엇을 고쳐야 할지 매월 명확해집니다."],
  ["shield", "누가 맡아도 같은 품질", "SOP·QA 체계로 담당자가 바뀌어도 응대 품질이 흔들리지 않습니다."],
  ["zap", "2주 안에 운영 시작", "매뉴얼이 없어도 URL 하나로 운영 기준을 설계해 빠르게 시작합니다."],
  ["trending", "채용 없이 확장", "문의량이 늘어도 시스템이 받쳐줘 채용 부담 없이 성장에 대응합니다."],
  ["headset", "책임지는 운영 파트너", "담당 매니저가 품질을 모니터링하고 매월 운영 인사이트를 전합니다."],
] as const;

function ValuesSection() {
  return (
    <section className="sec" id="value-sec">
      <div className="deco"><div className="deco-dots" /></div>
      <div className="wrap">
        <div className="sec-head sec-center">
          <span className="eyebrow-pill">Why Replo</span>
          <h2 className="t-h1">운영을 맡길 수 있는 이유</h2>
        </div>
        <div className="feat-grid" style={{ marginTop: 52 }}>
          {VALUES.map(([icon, title, description]) => (
            <div className="feat" key={title}>
              <div className="fi"><Icon name={icon} size={23} /></div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const REVIEWS = [
  ["문의가 흩어져 있던 상태에서 응대 기준이 정리되니, 팀 내부 커뮤니케이션 시간이 눈에 띄게 줄었습니다.", "김**", "D2C 브랜드 운영팀장"],
  ["반복 문의를 먼저 분류하고 FAQ와 상담 기준을 잡아주니, 신규 상담원이 들어와도 답변 품질이 흔들리지 않았습니다.", "이**", "리빙 브랜드 대표"],
  ["월간 리포트로 어떤 문의가 비용을 만들고 있는지 보이기 시작했습니다. CS를 개선 지표로 볼 수 있게 됐어요.", "박**", "CX 매니저"],
] as const;

function TestimonialsSection() {
  return (
    <section className="sec" id="reviews-sec">
      <div className="deco"><div className="deco-dots" /></div>
      <div className="wrap">
        <div className="sec-head sec-center">
          <span className="eyebrow-pill">Customer Voices</span>
          <h2 className="t-h1">현장에서 받은 변화</h2>
        </div>
        <div className="review-grid">
          {REVIEWS.map(([quote, name, role]) => (
            <div className="review-card" key={name}>
              <div className="review-stars">{[0, 1, 2, 3, 4].map((item) => <Icon key={item} name="star" size={16} />)}</div>
              <p className="review-q">“{quote}”</p>
              <div className="review-by">
                <div className="avatar">{name.slice(0, 1)}</div>
                <div><div className="review-name">{name}</div><div className="review-role">{role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const LANDING_PLANS = [
  ["Starter", "스타터", "₩99,000", "월 상담 50건", false, "운영 초기 브랜드가 채팅·게시판 문의를 가볍게 맡겨보는 시작 플랜", ["채팅·게시판 응대", "AI 응대 · 반복 문의 자동화", "FAQ 구축 · 상담 스크립트", "월간 운영 리포트"]],
  ["Lite", "라이트", "₩490,000", "월 상담 200건", false, "문의량이 증가하는 브랜드를 위한 기본 운영·분석 플랜", ["채팅·게시판·이메일 응대", "운영 인사이트 분석", "데일리 현황 알림", "월간 운영 리포트"]],
  ["Basic", "베이직", "₩990,000", "월 상담 500건", true, "전화·채팅·게시판·이메일을 함께 운영하며 품질을 안정화하는 성장 브랜드용", ["콜·채팅·게시판·이메일", "응대 가이드 제공", "교환·환불·클레임 운영", "격주 운영 리포트"]],
  ["Pro", "프로", "₩1,790,000", "월 상담 1,000건", false, "다채널 운영과 CS 정책 설계까지 필요한 브랜드에 적합", ["모든 채널 운영", "실시간 운영 대시보드", "CS 정책 설계 지원", "주간 리포트"]],
  ["Enterprise", "엔터프라이즈", "별도 협의", "월 상담 2,000건+", false, "전담 운영과 브랜드 맞춤 정책 설계가 필요한 대형 브랜드 맞춤 플랜", ["모든 채널 + 맞춤", "전담 상담 매니저", "정기 CX 운영 미팅", "API·시스템 연동"]],
] as const;

function LandingPricing() {
  return (
    <section className="sec-tight" style={{ background: "var(--bg)" }} id="pricing-sec">
      <div className="deco"><div className="deco-grid mask-top" /></div>
      <div className="wrap">
        <div className="sec-head sec-center" style={{ marginBottom: 52 }}>
          <span className="eyebrow-pill">Pricing</span>
          <h2 className="t-h1">운영 규모에 맞는 플랜</h2>
          <p className="t-lead" style={{ marginTop: 16 }}>월 상담 건수 기준의 단순한 요금제. 약정 없이 시작하고 언제든 변경할 수 있습니다.</p>
        </div>
        <div className="pricing5">
          {LANDING_PLANS.map(([en, ko, price, volume, best, description, features]) => (
            <div className={`tier${best ? " best" : ""}`} key={en}>
              {best ? <span className="tier-badge">Recommended</span> : null}
              <div className="tier-name-en">{en}</div>
              <div className="tier-name">{ko}</div>
              <div className="tier-price">{price}{price.startsWith("₩") ? <small> / 월</small> : null}</div>
              <span className="tier-vol">{volume}</span>
              <p style={{ fontSize: 12.5, color: "var(--ink-400)", lineHeight: 1.55, margin: "14px 0 0", wordBreak: "keep-all", minHeight: 54 }}>{description}</p>
              <ul className="tier-feats">
                {features.map((feature) => <li key={feature}><Icon name="check" size={15} stroke={2.3} />{feature}</li>)}
              </ul>
              <ButtonLink size="sm" variant={best ? "primary" : "ghost"} className="btn-block tier-cta">
                {en === "Enterprise" ? "영업팀 문의" : "이 플랜으로 시작"}
              </ButtonLink>
            </div>
          ))}
        </div>
        <p className="t-sm" style={{ textAlign: "center", marginTop: 24 }}>모든 금액은 부가세 별도 · 초과 상담은 건당 과금됩니다.</p>
      </div>
    </section>
  );
}

const LANDING_FAQ = [
  ["매뉴얼이 없어도 도입 가능한가요?", "가능합니다. 홈페이지, 상세페이지, 기존 문의 내용을 바탕으로 예상 질문과 운영 기준을 먼저 정리합니다. 완성된 자료가 없어도 시작할 수 있습니다."],
  ["AI 챗봇만 제공하는 서비스인가요?", "아닙니다. AI 활용은 일부입니다. 반복 문의와 기준이 명확한 문의는 자동화하고, 예외·민감 문의는 사람이 처리합니다. 상담 운영과 운영 기준 설계가 핵심입니다."],
  ["Replo는 BPO인가요?", "상담 인력도 제공하지만 단순 BPO는 아닙니다. Replo의 핵심은 사람·AI·운영 기준을 하나의 시스템으로 묶는 것입니다."],
  ["정말 2주 안에 시작 가능한가요?", "기본 자료 확인과 정책 인터뷰가 완료되면 약 2주 내 운영 시작을 목표로 합니다. 기존 FAQ·상세페이지·정책 문서가 있으면 더 빠릅니다."],
  ["기존 상담사를 유지하면서 사용할 수 있나요?", "가능합니다. 기존 담당자는 유지하고 Replo가 반복 문의, 운영 기준 정리, 리포트, 자동화 영역을 보완하는 방식으로도 운영할 수 있습니다."],
  ["소규모 브랜드나 문의량이 적어도 가능한가요?", "가능합니다. Starter 플랜은 월 50건 규모의 초기 브랜드도 이용할 수 있도록 설계했습니다. 문의량이 적을수록 채용보다 구독 방식이 유리합니다."],
  ["자동화 세팅도 해주나요?", "운영 데이터를 기반으로 반복 문의, 누락 체크, 리포트 등 자동화 가능한 영역을 설계하고 단계적으로 적용할 수 있도록 돕습니다."],
  ["계약 기간과 플랜 변경은 어떻게 되나요?", "3개월 의무 사용 후 월 단위로 이용 가능합니다. 운영 중 문의량과 채널이 늘어나면 상위 플랜으로 확장할 수 있으며, 초과 사용이 잦으면 안내해 드립니다."],
] as const;

function FaqSection() {
  const [open, setOpen] = useState(0);
  return (
    <section className="sec" id="faq-sec">
      <div className="wrap">
        <div className="sec-head sec-center" style={{ marginBottom: 40 }}>
          <span className="eyebrow-pill">FAQ</span>
          <h2 className="t-h1">자주 묻는 질문</h2>
        </div>
        <div className="faq">
          {LANDING_FAQ.map(([question, answer], index) => (
            <div className={`faq-item${open === index ? " open" : ""}`} key={question}>
              <button className="faq-q" type="button" onClick={() => setOpen(open === index ? -1 : index)}>{question}<Icon name="chevDown" size={20} /></button>
              <div className="faq-a"><div>{answer}</div></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="sec-tight">
      <div className="wrap">
        <div className="cta-band center">
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 className="t-h1" style={{ color: "#fff" }}>{homeCopy.finalCta.title[0]}<br />{homeCopy.finalCta.title[1]}</h2>
            <p style={{ fontSize: 17, lineHeight: 1.7, marginTop: 16 }}>{homeCopy.finalCta.description[0]}<br />{homeCopy.finalCta.description[1]}</p>
            <div className="cta-row">
              <ButtonLink size="lg" iconRight="arrowRight" className="source-cta-white">{homeCopy.finalCta.button}</ButtonLink>
              <ButtonLink size="lg" className="source-cta-outline">서비스 문의하기</ButtonLink>
            </div>
            <div className="cta-hint">문의 · sales@replo.kr</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Logo onDark />
            <p style={{ color: "rgba(255,255,255,.55)", fontSize: 14, lineHeight: 1.7, marginTop: 16, maxWidth: 300 }}>상담원 채용 대신, 고객센터 운영을 구독하세요. AI와 운영 전문가가 SOP·QA·자동화·리포트까지 하나의 시스템으로 운영합니다.</p>
          </div>
          <div><h5>서비스</h5><a href="#solution-sec">운영 시스템</a><a href="#approach-sec">방식의 차이</a><a href="#process-sec">시작 방법</a><a href="#pricing-sec">요금제</a></div>
          <div><h5>회사</h5><a href="#check-sec">자가 점검</a><a href="#cost-sec">비용 절감</a><a href="#faq-sec">FAQ</a></div>
          <div>
            <h5>회사 정보</h5>
            <address className="foot-company">
              <span>(주)아빈코퍼레이션</span>
              <span>대표자 김지민</span>
              <span>경기도 구리시 갈매중앙로 190, A동 10005호</span>
              <span>사업자등록번호 191-88-03596</span>
              <a href="mailto:sales@replo.kr">Contact sales@replo.kr</a>
              <a href="tel:07041380499">Tel 070-4138-0499</a>
            </address>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 (주)아빈코퍼레이션</span>
          <span>상담원 채용 대신, 고객센터 운영을 구독하세요.</span>
        </div>
      </div>
    </footer>
  );
}

export function SourceHome() {
  return (
    <div className="replo-source-home">
      <div className="mkt">
        <MarketingNav />
        <Hero />
        <ChecklistSection />
        <CauseSection />
        <WhyNowSection />
        <SolutionSection />
        <ApproachSection />
        <ProcessSection />
        <CostSection />
        <ImpactSection />
        <ValuesSection />
        <TestimonialsSection />
        <LandingPricing />
        <FaqSection />
        <CtaSection />
        <Footer />
      </div>
    </div>
  );
}
