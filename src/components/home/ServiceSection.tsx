const reasons = [
  ["24h", "고객 기대 수준이 높아졌습니다", "24시간 이내 응답이 기본이 됐습니다. 느린 응대는 곧 이탈과 낮은 평점으로 이어집니다."],
  ["시즌 ↑", "문의량은 계속 증가합니다", "브랜드가 성장할수록 CS 부담은 비례해 커집니다. 사람만 늘리는 방식은 한계가 있습니다."],
  ["3,600만+", "인건비는 계속 오릅니다", "상담원 1명 총 고용비용은 연 3,600만 원 이상. 채용을 늘릴수록 고정비 부담이 커집니다."],
  ["96%", "이탈은 조용히 일어납니다", "불만 고객의 96%는 아무 말 없이 떠납니다. 보이지 않는 손실이 매출을 갉아먹습니다."],
];

const systemItems = [
  ["AI 자동화", "반복 문의는 AI가 1차 응대·분류"],
  ["상담 운영", "콜·채팅·게시판·이메일 통합 응대"],
  ["SOP 설계", "응대 기준·스크립트를 표준화"],
  ["QA 관리", "응대 품질을 일정하게 모니터링"],
  ["VOC 분석", "문의 데이터에서 개선점 도출"],
  ["운영 리포트", "월간 인사이트로 운영 개선"],
];

export function ServiceSection() {
  return (
    <>
      <section className="relative overflow-hidden bg-white py-24 sm:py-28">
        <div className="absolute right-[-180px] top-20 h-[420px] w-[420px] rounded-full bg-[#F7F6FF]" />
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mx-auto max-w-[820px] text-center">
            <p className="text-sm font-extrabold tracking-[0.14em] text-[#5B47E0]">WHY NOW</p>
            <h2 className="mt-5 text-[34px] font-extrabold leading-[1.16] tracking-[-0.045em] text-[#0E1430] sm:text-[42px]">
              운영 구조가 없으면
              <br />
              비용은 계속 커집니다
            </h2>
          </div>

          <div className="relative mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {reasons.map(([metric, title, body]) => (
              <article key={title} className="relative overflow-hidden rounded-[30px] border border-[#E2E6EF] bg-white p-7 shadow-[0_16px_46px_rgba(17,24,39,0.06)]">
                <div className="absolute right-[-34px] top-[-34px] h-24 w-24 rounded-full bg-[#F1EEFF]" />
                <p className="relative text-4xl font-extrabold tracking-[-0.05em] text-[#5B47E0]">{metric}</p>
                <h3 className="mt-5 text-lg font-extrabold text-[#0E1430]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5F6685]">{body}</p>
              </article>
            ))}
          </div>

          <p className="mx-auto mt-12 max-w-[820px] rounded-[28px] border border-[#DED9FF] bg-[#FBFAFF] px-6 py-7 text-center text-lg font-bold leading-8 text-[#2C3357] shadow-[0_18px_52px_rgba(91,71,224,0.08)]">
            문의량은 늘어나고, 상담원은 부족해지고, 인건비는 오릅니다.
            <br />
            지금 운영 구조를 갖추는 것이 가장 확실한 비용 절감입니다.
          </p>
        </div>
      </section>

      <section id="service" className="relative scroll-mt-24 overflow-hidden bg-[#F7F6FF] py-24 sm:py-28">
        <div className="absolute left-1/2 top-32 h-[760px] w-[760px] -translate-x-1/2 rounded-full bg-white/55 blur-3xl" />
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mx-auto max-w-[820px] text-center">
            <p className="text-sm font-extrabold tracking-[0.14em] text-[#5B47E0]">SOLUTION</p>
            <h2 className="mt-5 text-[34px] font-extrabold leading-[1.16] tracking-[-0.045em] text-[#0E1430] sm:text-[42px]">
              고객센터 운영을
              <br />
              하나의 시스템으로
            </h2>
            <p className="mx-auto mt-5 max-w-[720px] text-base leading-7 text-[#5F6685]">
              흩어져 있던 상담·자동화·운영 기준·데이터를 Replo가 하나의 운영 시스템으로 묶어 운영합니다.
            </p>
          </div>

          <div className="relative mt-14 grid gap-5 lg:grid-cols-[1fr_320px_1fr] lg:items-center">
            <div className="absolute left-[25%] right-[25%] top-1/2 hidden border-t border-dashed border-[#CFC8F6] lg:block" />
            <div className="grid gap-5">
              {systemItems.slice(0, 3).map(([title, body]) => (
                <article key={title} className="relative rounded-[28px] border border-[#E2E6EF] bg-white p-6 text-left shadow-[0_16px_42px_rgba(17,24,39,0.06)]">
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F1EFFF] text-sm font-extrabold text-[#5B47E0]">+</span>
                  <h3 className="text-lg font-extrabold text-[#0E1430]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5F6685]">{body}</p>
                </article>
              ))}
            </div>

            <div className="relative z-10 rounded-[36px] bg-[#5B47E0] p-9 text-center text-white shadow-[0_28px_70px_rgba(91,71,224,0.32)]">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border-[22px] border-white/10" />
              <div className="absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-white/10" />
              <p className="text-sm font-extrabold text-[#DCD6FF]">CS 운영 구독</p>
              <p className="relative mt-3 text-5xl font-extrabold tracking-[-0.06em]">Replo+</p>
              <p className="mt-5 text-sm leading-6 text-[#ECE9FF]">
                사람 · AI · 운영 기준을 하나로 묶어, 누가 맡아도 흔들리지 않는 운영 시스템
              </p>
            </div>

            <div className="grid gap-5">
              {systemItems.slice(3).map(([title, body]) => (
                <article key={title} className="relative rounded-[28px] border border-[#E2E6EF] bg-white p-6 text-left shadow-[0_16px_42px_rgba(17,24,39,0.06)]">
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F1EFFF] text-sm font-extrabold text-[#5B47E0]">+</span>
                  <h3 className="text-lg font-extrabold text-[#0E1430]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5F6685]">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
