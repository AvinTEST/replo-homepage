const reasons = [
  ["사람·AI·시스템을 하나로", "상담 인력, AI 자동화, 운영 기준을 한 팀이 통합해 운영합니다. 따로 붙이지 않아도 됩니다."],
  ["데이터로 증명하는 개선", "모든 문의가 데이터로 쌓여, 무엇을 고쳐야 할지 매월 명확해집니다."],
  ["누가 맡아도 같은 품질", "SOP·QA 체계로 담당자가 바뀌어도 응대 품질이 흔들리지 않습니다."],
  ["2주 안에 운영 시작", "매뉴얼이 없어도 URL 하나로 운영 기준을 설계해 빠르게 시작합니다."],
  ["채용 없이 확장", "문의량이 늘어도 시스템이 받쳐줘 채용 부담 없이 성장에 대응합니다."],
  ["책임지는 운영 파트너", "담당 매니저가 품질을 모니터링하고 매월 운영 인사이트를 전합니다."],
];

const testimonials = [
  ["김**", "D2C 브랜드 운영팀장", "패션 커머스 A사", "문의가 흩어져 있던 상태에서 응대 기준이 정리되니, 팀 내부 커뮤니케이션 시간이 눈에 띄게 줄었습니다."],
  ["이**", "리빙 브랜드 대표", "홈리빙 커머스 B사", "반복 문의를 먼저 분류하고 FAQ와 상담 기준을 잡아주니, 신규 상담원이 들어와도 답변 품질이 흔들리지 않았습니다."],
  ["박**", "CX 매니저", "푸드 커머스 C사", "월간 리포트로 어떤 문의가 비용을 만들고 있는지 보이기 시작했습니다. CS를 개선 지표로 볼 수 있게 됐어요."],
  ["정**", "이커머스 운영 리드", "뷰티 커머스 D사", "프로모션 기간마다 응대량이 튀는 문제가 있었는데, 운영 기준과 우선순위가 생겨 대응 속도가 안정됐습니다."],
];

const plans = [
  {
    name: "STARTER",
    title: "스타터",
    price: "₩99,000",
    volume: "월 상담 50건",
    description: "운영 초기 브랜드가 채팅·게시판 문의를 가볍게 맡겨보는 시작 플랜",
    features: ["채팅·게시판 응대", "AI 응대 · 반복 문의 자동화", "FAQ 구축 · 상담 스크립트", "월간 운영 리포트"],
  },
  {
    name: "LITE",
    title: "라이트",
    price: "₩490,000",
    volume: "월 상담 200건",
    description: "문의량이 증가하는 브랜드를 위한 기본 운영·분석 플랜",
    features: ["채팅·게시판·이메일 응대", "운영 인사이트 분석", "데일리 현황 알림", "월간 운영 리포트"],
  },
  {
    name: "BASIC",
    title: "베이직",
    price: "₩990,000",
    volume: "월 상담 500건",
    description: "전화·채팅·게시판·이메일을 함께 운영하며 품질을 안정화하는 성장 브랜드용",
    features: ["콜·채팅·게시판·이메일", "응대 가이드 제공", "교환·환불·클레임 운영", "격주 운영 리포트"],
    recommended: true,
  },
  {
    name: "PRO",
    title: "프로",
    price: "₩1,790,000",
    volume: "월 상담 1,000건",
    description: "다채널 운영과 CS 정책 설계까지 필요한 브랜드에 적합",
    features: ["모든 채널 운영", "실시간 운영 대시보드", "CS 정책 설계 지원", "주간 리포트"],
  },
  {
    name: "ENTERPRISE",
    title: "엔터프라이즈",
    price: "별도 협의",
    volume: "월 상담 2,000건+",
    description: "전담 운영과 브랜드 맞춤 정책 설계가 필요한 대형 브랜드 맞춤 플랜",
    features: ["모든 채널 + 맞춤", "전담 상담 매니저", "정기 CX 운영 미팅", "API·시스템 연동"],
    cta: "영업팀 문의",
  },
];

export function PricingSection() {
  return (
    <>
      <section className="relative overflow-hidden bg-white py-24 sm:py-28">
        <div className="absolute right-[-180px] top-24 h-[420px] w-[420px] rounded-full bg-[#F7F6FF]" />
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mx-auto max-w-[820px] text-center">
            <p className="text-sm font-extrabold tracking-[0.14em] text-[#5B47E0]">WHY REPLO</p>
            <h2 className="mt-5 text-[34px] font-extrabold leading-[1.16] tracking-[-0.045em] text-[#0E1430] sm:text-[42px]">
              운영을 맡길 수 있는 이유
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {reasons.map(([title, body], index) => (
              <article key={title} className="relative overflow-hidden rounded-[28px] border border-[#E2E6EF] bg-white p-7 shadow-[0_16px_44px_rgba(17,24,39,0.06)]">
                <div className="absolute right-[-30px] top-[-30px] h-24 w-24 rounded-full bg-[#F1EFFF]" />
                <span className="relative mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5B47E0] text-sm font-extrabold text-white">
                  {index + 1}
                </span>
                <h3 className="text-lg font-extrabold text-[#0E1430]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5F6685]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#F7F6FF] py-24 sm:py-28">
        <div className="absolute left-1/2 top-[-260px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#E7E2FF] blur-3xl" />
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mx-auto max-w-[820px] text-center">
            <p className="text-sm font-extrabold tracking-[0.14em] text-[#5B47E0]">CUSTOMER VOICES</p>
            <h2 className="mt-5 text-[34px] font-extrabold leading-[1.16] tracking-[-0.045em] text-[#0E1430] sm:text-[42px]">
              현장에서 받은 변화
            </h2>
            <p className="mx-auto mt-5 max-w-[720px] text-base leading-7 text-[#5F6685]">
              실제 고객명은 보호하고, 운영 개선 경험만 담았습니다.
            </p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {testimonials.map(([name, role, company, quote]) => (
              <article key={company} className="rounded-[28px] border border-[#E2E6EF] bg-white p-6 shadow-[0_18px_48px_rgba(17,24,39,0.06)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold text-[#5B47E0]">★★★★★</p>
                  <span className="rounded-full bg-[#F1EFFF] px-3 py-1 text-[11px] font-extrabold text-[#5B47E0]">VOICE</span>
                </div>
                <p className="mt-5 text-sm leading-7 text-[#2C3357]">“{quote}”</p>
                <div className="mt-6 border-t border-[#EEF0F5] pt-5">
                  <p className="font-extrabold text-[#0E1430]">{name}</p>
                  <p className="mt-1 text-xs font-semibold text-[#7B8198]">{role}</p>
                  <p className="mt-1 text-xs text-[#7B8198]">{company}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="relative scroll-mt-24 overflow-hidden bg-white py-24 sm:py-28">
        <div className="absolute left-[-180px] bottom-20 h-[420px] w-[420px] rounded-full bg-[#F7F6FF]" />
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mx-auto max-w-[820px] text-center">
            <p className="text-sm font-extrabold tracking-[0.14em] text-[#5B47E0]">PRICING</p>
            <h2 className="mt-5 text-[34px] font-extrabold leading-[1.16] tracking-[-0.045em] text-[#0E1430] sm:text-[42px]">
              운영 규모에 맞는 플랜
            </h2>
            <p className="mx-auto mt-5 max-w-[720px] text-base leading-7 text-[#5F6685]">
              월 상담 건수 기준의 단순한 요금제. 약정 없이 시작하고 언제든 변경할 수 있습니다.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-5">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative flex flex-col overflow-hidden rounded-[28px] border p-6 ${
                  plan.recommended
                    ? "border-[#5B47E0] bg-[#5B47E0] text-white shadow-[0_28px_70px_rgba(91,71,224,0.32)]"
                    : "border-[#E2E6EF] bg-white text-[#0E1430] shadow-[0_16px_44px_rgba(17,24,39,0.06)]"
                }`}
              >
                <div className={`absolute right-[-38px] top-[-38px] h-28 w-28 rounded-full ${plan.recommended ? "bg-white/10" : "bg-[#F7F6FF]"}`} />
                {plan.recommended ? (
                  <span className="absolute right-5 top-5 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-[#5B47E0]">
                    Recommended
                  </span>
                ) : null}
                <p className={`relative text-xs font-extrabold tracking-[0.08em] ${plan.recommended ? "text-[#DCD6FF]" : "text-[#5B47E0]"}`}>{plan.name}</p>
                <h3 className="relative mt-3 text-xl font-extrabold">{plan.title}</h3>
                <p className="relative mt-5 text-2xl font-extrabold tracking-[-0.04em]">{plan.price}</p>
                <p className={`mt-1 text-xs font-bold ${plan.recommended ? "text-[#E5E1FF]" : "text-[#7B8198]"}`}>/ 월</p>
                <p className={`mt-4 text-sm font-bold ${plan.recommended ? "text-white" : "text-[#0E1430]"}`}>{plan.volume}</p>
                <p className={`mt-4 min-h-[72px] text-xs leading-6 ${plan.recommended ? "text-[#E5E1FF]" : "text-[#5F6685]"}`}>{plan.description}</p>
                <div className={`my-5 border-t ${plan.recommended ? "border-white/20" : "border-[#EEF0F5]"}`} />
                <ul className="flex-1 space-y-3 text-xs font-semibold leading-5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className={plan.recommended ? "text-white" : "text-[#5B47E0]"}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="/diagnosis"
                  className={`mt-7 inline-flex h-10 items-center justify-center rounded-xl text-sm font-extrabold shadow-[0_10px_24px_rgba(91,71,224,0.18)] ${
                    plan.recommended ? "bg-white text-[#5B47E0]" : "bg-[#5B47E0] text-white"
                  }`}
                >
                  {plan.cta ?? "이 플랜으로 시작"}
                </a>
              </article>
            ))}
          </div>

          <div className="mt-9 text-center">
            <a href="/diagnosis" className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D8DDE8] bg-white px-6 text-sm font-extrabold text-[#2C3357]">
              플랜별 기능 전체 비교
            </a>
            <p className="mt-5 text-xs leading-5 text-[#7B8198]">모든 금액은 부가세 별도 · 초과 상담은 건당 과금됩니다.</p>
          </div>
        </div>
      </section>
    </>
  );
}
