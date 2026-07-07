"use client";

import { useState } from "react";

// Small client island: the "요금제 더보기" toggle reveals additional plan
// tiers that differ by monthly inquiry volume and service scope. Kept out of
// the server page so the rest of /ads stays static-friendly. The CTA target
// (with forwarded utm/fbclid query string) is passed down from the page.

const Chevron = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
);
const Check = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12.5l5 5 11-11" /></svg>
);
const Arrow = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

type Tier = {
  name: string;
  price: string;
  unit?: string;
  note?: string;
  volume: string;
  badge?: string;
  pop?: boolean;
  features: string[];
};

const tiers: Tier[] = [
  {
    name: "런칭 특가",
    price: "월 59만원",
    note: "7월 한정",
    volume: "월 문의 500건 기준",
    badge: "진행중",
    pop: true,
    features: [
      "상담 응대 (채팅 · 게시판 · 이메일)",
      "반복 문의 자동화",
      "챗봇 구조설계",
      "FAQ · SOP 정리",
      "월간 운영 리포트",
    ],
  },
  {
    name: "그로스",
    price: "월 99만원",
    volume: "월 문의 1,500건 기준",
    features: [
      "런칭 특가 전체 포함",
      "다채널 응대 확대",
      "우선 응대 처리",
      "주간 운영 리포트",
    ],
  },
  {
    name: "스케일",
    price: "맞춤 견적",
    volume: "월 문의 3,000건 이상",
    features: [
      "전담 운영 매니저 배정",
      "맞춤 자동화 · 채널 연동 설계",
      "실시간 리포트 대시보드",
      "SLA 기반 운영",
    ],
  },
];

export function PlanTiers({ contactHref }: { contactHref: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="ads-tiers-wrap">
      <button
        type="button"
        className="ads-more"
        aria-expanded={open}
        aria-controls="ads-tier-list"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "요금제 접기" : "문의량별 요금제 더보기"}
        {Chevron}
      </button>

      {open && (
        <div className="ads-tiers" id="ads-tier-list">
          <p className="hint">문의 응대량과 서비스 범위에 따라 선택할 수 있습니다.</p>
          {tiers.map((t) => (
            <div className={`ads-tier${t.pop ? " pop" : ""}`} key={t.name}>
              <div className="thead">
                <span className="tname">
                  {t.name}
                  {t.badge && <span className="tbadge">{t.badge}</span>}
                </span>
                <span className="tprice">
                  {t.note && <small>{t.note} </small>}
                  {t.price}
                </span>
              </div>
              <span className="tvol">{t.volume}</span>
              <ul>
                {t.features.map((f) => (
                  <li key={f}>{Check}{f}</li>
                ))}
              </ul>
              <a className="ads-cta" href={contactHref}>
                무료 진단으로 시작{Arrow}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
