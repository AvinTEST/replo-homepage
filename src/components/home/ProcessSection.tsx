const comparisonRows = [
  ["상담 인력 투입 중심", "문의 구조 진단 후 운영 설계"],
  ["매뉴얼이 없으면 그대로 응대", "상세페이지·정책·FAQ 기반 상담 가이드 제작"],
  ["문의가 늘면 비용 증가", "반복 문의를 줄이는 구조 개선"],
  ["월 처리 건수 중심 보고", "문의 유형·반복 이슈·개선 포인트 리포트"],
  ["단순 응대 대행", "상담 운영·자동화·VOC 정리까지 포함"],
];

const steps = [
  ["STEP 01", "URL 제출", "홈페이지 또는 상세페이지 링크를 전달합니다."],
  ["STEP 02", "정책 인터뷰", "교환·반품·배송 등 핵심 정책을 함께 정리합니다."],
  ["STEP 03", "운영 기준 설계", "SOP·FAQ·응대 스크립트를 Replo가 설계합니다."],
  ["STEP 04", "운영 시작", "계약 후 2주 내 실제 상담 운영을 시작합니다."],
  ["STEP 05", "VOC 리포트", "운영 데이터로 월간 인사이트를 제공합니다."],
];

export function ProcessSection() {
  return (
    <>
      <section className="relative overflow-hidden bg-white py-24 sm:py-28">
        <div className="absolute left-[-160px] top-28 h-80 w-80 rounded-full bg-[#F7F6FF]" />
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mx-auto max-w-[880px] text-center">
            <p className="text-sm font-extrabold tracking-[0.14em] text-[#5B47E0]">WHY DIFFERENT</p>
            <h2 className="mt-5 text-[32px] font-extrabold leading-[1.18] tracking-[-0.045em] text-[#0E1430] sm:text-[42px]">
              Replo는 상담을 대신 받는 회사가 아니라,
              <br />
              반복 문의가 줄어드는 CS 구조를 설계합니다
            </h2>
          </div>

          <div className="relative mt-12 overflow-hidden rounded-[32px] border border-[#E2E6EF] bg-white shadow-[0_24px_70px_rgba(17,24,39,0.08)]">
            <div className="grid grid-cols-2">
              <div className="bg-[#F6F7FA] px-5 py-5 text-sm font-extrabold text-[#5F6685] sm:px-8">기존 CS 외주</div>
              <div className="bg-[#5B47E0] px-5 py-5 text-sm font-extrabold text-white sm:px-8">Replo +</div>
            </div>
            {comparisonRows.map(([legacy, replo], index) => (
              <div key={legacy} className="grid grid-cols-1 border-t border-[#E8EBF2] text-sm leading-6 sm:grid-cols-2">
                <p className="px-5 py-5 text-[#7B8198] sm:px-8">
                  <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#E9ECF3] text-xs font-extrabold text-[#7B8198]">
                    {index + 1}
                  </span>
                  {legacy}
                </p>
                <p className="bg-[#FBFAFF] px-5 py-5 font-bold text-[#0E1430] sm:px-8">
                  <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#F1EFFF] text-xs font-extrabold text-[#5B47E0]">
                    +
                  </span>
                  {replo}
                </p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-[760px] text-center text-base font-bold leading-7 text-[#2C3357]">
            단순 콜센터 대행이 아니라, 고객센터 운영 구조 자체를 설계합니다.
          </p>
        </div>
      </section>

      <section id="process" className="relative scroll-mt-24 overflow-hidden bg-[#F7F6FF] py-24 sm:py-28">
        <div className="absolute right-[-180px] top-20 h-[420px] w-[420px] rounded-full bg-[#E7E2FF] blur-3xl" />
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mx-auto max-w-[820px] text-center">
            <p className="text-sm font-extrabold tracking-[0.14em] text-[#5B47E0]">HOW IT WORKS</p>
            <h2 className="mt-5 text-[34px] font-extrabold leading-[1.16] tracking-[-0.045em] text-[#0E1430] sm:text-[42px]">
              링크 하나면 시작됩니다
            </h2>
            <p className="mx-auto mt-5 max-w-[720px] text-base leading-7 text-[#5F6685]">
              매뉴얼도, 완성된 정책도 필요 없습니다. 홈페이지 URL 하나만 보내주시면 Replo가 운영 기준 초안을 만들어 드립니다.
            </p>
          </div>

          <div className="relative mt-12 grid gap-4 md:grid-cols-5">
            <div className="absolute left-[9%] right-[9%] top-8 hidden border-t border-dashed border-[#CFC8F6] md:block" />
            {steps.map(([eyebrow, title, body], index) => (
              <article key={eyebrow} className="relative rounded-[26px] border border-[#E2E6EF] bg-white p-6 shadow-[0_16px_44px_rgba(17,24,39,0.06)]">
                <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#5B47E0] text-xl font-extrabold text-white shadow-[0_12px_28px_rgba(91,71,224,0.24)]">
                  {index + 1}
                </span>
                <p className="text-xs font-extrabold tracking-[0.08em] text-[#5B47E0]">{eyebrow}</p>
                <h3 className="mt-4 text-lg font-extrabold text-[#0E1430]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5F6685]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
