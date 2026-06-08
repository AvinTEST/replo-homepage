const costRows = [
  ["기본 인건비 / 월 구독료", "상담원 연봉 약 3,000만 ÷ 12", "250만 원", "99만 원"],
  ["4대보험 (사업주 부담)", "약 10~11%", "27만 원", "0원"],
  ["채용·교육비", "채용비·온보딩 교육", "15만 원", "0원"],
  ["복리후생·운영 간접비", "식대·장비·좌석·관리", "18만 원", "0원"],
  ["SOP·QA·리포트·자동화", "운영 시스템 전반", "별도 구축 필요", "구독에 포함"],
];

const impactRows = [
  ["담당자 1명에게 운영이 묶임", "운영 기준이 시스템에 남음"],
  ["같은 질문에 매일 같은 답 반복", "반복 문의는 자동으로 처리"],
  ["사람마다 다른 응대 품질", "QA로 일정한 응대 품질"],
  ["데이터 없이 감으로 운영", "월간 리포트로 개선점 발견"],
  ["문의 늘면 채용으로만 버팀", "채용 없이 시스템으로 확장"],
];

export function CostSection() {
  return (
    <>
      <section id="cost" className="relative scroll-mt-24 overflow-hidden bg-white py-24 sm:py-28">
        <div className="absolute left-1/2 top-[-280px] h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#F7F6FF] blur-3xl" />
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mx-auto max-w-[880px] text-center">
            <p className="text-sm font-extrabold tracking-[0.14em] text-[#5B47E0]">COST</p>
            <h2 className="mt-5 text-[34px] font-extrabold leading-[1.16] tracking-[-0.045em] text-[#0E1430] sm:text-[42px]">
              상담원 1명 채용 비용으로
              <br />
              운영 시스템 전체를 구축합니다
            </h2>
            <p className="mx-auto mt-5 max-w-[760px] text-base leading-7 text-[#5F6685]">
              사람 1명을 채용하는 대신, 채용·교육·QA·리포트·AI 자동화까지 고객센터 운영에 필요한 모든 것을 갖출 수 있습니다.
            </p>
          </div>

          <div className="relative mt-12 overflow-hidden rounded-[32px] border border-[#E2E6EF] bg-white shadow-[0_24px_70px_rgba(17,24,39,0.08)]">
            <div className="grid grid-cols-[1.3fr_0.8fr_0.8fr] bg-[#0E1430] px-5 py-5 text-xs font-extrabold text-white sm:px-8 sm:text-sm">
              <span>항목</span>
              <span>직접 채용 (월)</span>
              <span className="text-[#DCD6FF]">Replo Basic (월)</span>
            </div>
            {costRows.map(([label, note, hire, replo]) => (
              <div key={label} className="grid grid-cols-1 gap-3 border-t border-[#E8EBF2] px-5 py-5 text-sm even:bg-[#FBFAFF] sm:grid-cols-[1.3fr_0.8fr_0.8fr] sm:px-8">
                <div>
                  <p className="font-extrabold text-[#0E1430]">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-[#7B8198]">{note}</p>
                </div>
                <p className="font-bold text-[#5F6685]">{hire}</p>
                <p className="inline-flex w-fit rounded-full bg-[#F1EFFF] px-3 py-1 font-extrabold text-[#5B47E0]">{replo}</p>
              </div>
            ))}
            <div className="grid grid-cols-1 gap-3 border-t border-[#D9D2FF] bg-[#5B47E0] px-5 py-7 text-sm text-white sm:grid-cols-[1.3fr_0.8fr_0.8fr] sm:px-8">
              <p className="font-extrabold text-white">월 합계</p>
              <p className="font-extrabold text-white/80 line-through">약 310만 원</p>
              <p className="font-extrabold text-white">99만 원 · 약 68% 저렴 ↓</p>
            </div>
            <div className="grid grid-cols-1 gap-3 border-t border-[#E8EBF2] px-5 py-5 text-sm sm:grid-cols-[1.3fr_0.8fr_0.8fr] sm:px-8">
              <p className="font-extrabold text-[#0E1430]">연 환산</p>
              <p className="font-bold text-[#5F6685]">3,720만 원</p>
              <p className="font-extrabold text-[#5B47E0]">매년 2,532만 원 절약</p>
            </div>
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-[#7B8198]">
            산출 기준 · 인건비는 직무·지역·연차에 따라 달라질 수 있으며, 위 금액은 일반적인 시장 단가를 바탕으로 한 추정치입니다.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#F7F6FF] py-24 sm:py-28">
        <div className="absolute left-[-160px] bottom-20 h-80 w-80 rounded-full bg-white/70" />
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mx-auto max-w-[820px] text-center">
            <p className="text-sm font-extrabold tracking-[0.14em] text-[#5B47E0]">IMPACT</p>
            <h2 className="mt-5 text-[34px] font-extrabold leading-[1.16] tracking-[-0.045em] text-[#0E1430] sm:text-[42px]">
              사람에 기대던 운영이
              <br />
              시스템으로 바뀝니다
            </h2>
            <p className="mx-auto mt-5 max-w-[720px] text-base leading-7 text-[#5F6685]">
              담당자 한 명에게 묶여 있던 고객센터가, 누가 맡아도 흔들리지 않는 구조로 바뀝니다.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-[32px] border border-[#E2E6EF] bg-white shadow-[0_24px_70px_rgba(17,24,39,0.08)]">
            <div className="grid grid-cols-2 bg-[#0E1430] px-5 py-4 text-sm font-extrabold text-white sm:px-8">
              <span>REPLO 도입 전</span>
              <span>REPLO 도입 후</span>
            </div>
            {impactRows.map(([before, after]) => (
              <div key={before} className="grid grid-cols-1 gap-3 border-t border-[#E8EBF2] text-sm leading-6 sm:grid-cols-2">
                <p className="px-5 py-5 text-[#7B8198] sm:px-8">{before}</p>
                <p className="bg-[#FBFAFF] px-5 py-5 font-bold text-[#0E1430] sm:px-8">
                  <span className="mr-3 text-[#5B47E0]">✓</span>
                  {after}
                </p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-[760px] text-center text-base font-bold leading-7 text-[#2C3357]">
            결국 고객센터가 비용 센터에서 성장 자산으로 바뀝니다.
          </p>
        </div>
      </section>
    </>
  );
}
