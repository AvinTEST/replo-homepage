const checkItems = [
  ["반복 문의", "고객이 같은 질문을 계속 하고 있는가"],
  ["상담 전환", "FAQ·자동응답으로 막을 수 있는 문의가 상담원에게 넘어오고 있는가"],
  ["정책 정리", "취소·교환·반품·배송·A/S 기준이 상담사가 바로 답할 수 있게 정리되어 있는가"],
  ["응대 품질", "상담사마다 답변 기준이 달라지고 있지 않은가"],
  ["리포트", "문의 데이터를 보고 개선할 항목이 정리되고 있는가"],
];

export function ProblemSection() {
  return (
    <>
      <section id="problem" className="relative scroll-mt-24 overflow-hidden bg-white py-24 sm:py-28">
        <div className="absolute left-[-140px] top-24 h-72 w-72 rounded-full bg-[#F1EEFF]" />
        <div className="absolute right-[-120px] bottom-12 h-80 w-80 rounded-full border-[46px] border-[#F7F6FF]" />
        <div className="relative mx-auto max-w-[820px] px-6 text-center">
          <p className="text-sm font-extrabold tracking-[0.14em] text-[#5B47E0]">SELF-CHECK</p>
          <h2 className="mt-5 text-[34px] font-extrabold leading-[1.16] tracking-[-0.045em] text-[#0E1430] sm:text-[42px]">
            혹시, 이런 상황
            <br />
            아니신가요?
          </h2>
          <p className="mx-auto mt-5 max-w-[640px] text-base leading-7 text-[#5F6685]">
            고객센터 운영을 점검하는 5가지 질문. 하나라도 해당된다면, 문제는 사람이 아니라 운영 시스템입니다.
          </p>

          <div className="mt-12 space-y-3 text-left">
            {checkItems.map(([title, body], index) => (
              <div
                key={title}
                className="group rounded-[24px] border border-[#E2E6EF] bg-white px-5 py-4 shadow-[0_14px_40px_rgba(17,24,39,0.06)] transition hover:-translate-y-0.5 hover:border-[#CFC8F6] hover:bg-[#FBFAFF] hover:shadow-[0_20px_52px_rgba(91,71,224,0.12)] sm:px-6 sm:py-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1EFFF] text-sm font-extrabold text-[#5B47E0] group-hover:bg-[#5B47E0] group-hover:text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-[110px]">
                    <span className="text-sm font-extrabold text-[#5B47E0]">{title}</span>
                  </div>
                  <p className="text-base font-semibold leading-7 text-[#2C3357]">{body}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm font-semibold text-[#7B8198]">항목을 눌러 우리 고객센터를 점검해 보세요.</p>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#F7F6FF] py-24 sm:py-28">
        <div className="absolute left-1/2 top-[-280px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#E7E2FF] blur-3xl" />
        <div className="relative mx-auto max-w-[900px] px-6 text-center">
          <p className="text-sm font-extrabold tracking-[0.14em] text-[#5B47E0]">ROOT CAUSE</p>
          <h2 className="mt-5 text-[34px] font-extrabold leading-[1.16] tracking-[-0.045em] text-[#0E1430] sm:text-[42px]">
            운영의 문제는 사람이 아닙니다
          </h2>
          <p className="mx-auto mt-5 max-w-[720px] text-base leading-7 text-[#5F6685]">
            많은 브랜드가 고객센터 문제를 사람 부족으로 진단합니다. 하지만 사람을 더 뽑아도 문제가 반복된다면, 원인은 다른 곳에 있습니다.
          </p>

          <div className="mt-12 grid gap-5 md:grid-cols-[1fr_72px_1fr] md:items-center">
            <article className="rounded-[30px] border border-[#E3E6EF] bg-white p-8 text-left shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
              <p className="text-sm font-extrabold text-[#7B8198]">흔한 진단</p>
              <h3 className="mt-4 text-2xl font-extrabold tracking-[-0.035em] text-[#0E1430]">“사람이 부족해서 그렇다”</h3>
              <p className="mt-4 text-[15px] leading-7 text-[#5F6685]">
                채용을 늘리고 더 오래 일하게 합니다. 비용은 커지지만, 같은 문제는 다음 달에도 반복됩니다.
              </p>
            </article>
            <div className="mx-auto hidden h-14 w-14 items-center justify-center rounded-full bg-[#5B47E0] text-xl font-extrabold text-white shadow-[0_18px_42px_rgba(91,71,224,0.24)] md:flex">
              +
            </div>
            <article className="rounded-[30px] border border-[#D9D2FF] bg-white p-8 text-left shadow-[0_22px_58px_rgba(91,71,224,0.14)]">
              <p className="text-sm font-extrabold text-[#5B47E0]">진짜 원인</p>
              <h3 className="mt-4 text-2xl font-extrabold tracking-[-0.035em] text-[#0E1430]">운영 구조가 없는 것</h3>
              <p className="mt-4 text-[15px] leading-7 text-[#5F6685]">
                SOP·QA·데이터가 없으면 사람이 바뀔 때마다 품질이 흔들립니다. Replo는 사람에 의존하지 않는 구조를 만듭니다.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
