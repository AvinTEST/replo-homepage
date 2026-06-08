const faqs = [
  ["매뉴얼이 없어도 도입 가능한가요?", "가능합니다. 홈페이지, 상세페이지, 기존 문의 내용을 바탕으로 예상 질문과 운영 기준을 먼저 정리합니다. 완성된 자료가 없어도 시작할 수 있습니다."],
  ["AI 챗봇만 제공하는 서비스인가요?", "아닙니다. AI 활용은 일부입니다. 반복 문의와 기준이 명확한 문의는 자동화하고, 예외·민감 문의는 사람이 처리합니다. 상담 운영과 운영 기준 설계가 핵심입니다."],
  ["Replo는 BPO인가요?", "상담 인력도 제공하지만 단순 BPO는 아닙니다. 상담 운영, 자동화, VOC 정리, 운영 리포트까지 함께 설계하고 관리합니다."],
  ["정말 2주 안에 시작 가능한가요?", "운영 범위와 자료 준비 상태에 따라 달라질 수 있지만, 홈페이지 URL과 기본 정책이 있으면 빠르게 기준 초안을 만들고 시작 일정을 잡을 수 있습니다."],
  ["기존 상담사를 유지하면서 사용할 수 있나요?", "가능합니다. 기존 담당자가 처리하는 업무와 Replo가 맡을 업무를 나눠 운영 구조를 함께 설계할 수 있습니다."],
  ["소규모 브랜드나 문의량이 적어도 가능한가요?", "가능합니다. 초기 브랜드는 작은 상담량부터 운영 기준과 반복 문의 자동화를 정리하는 방식으로 시작할 수 있습니다."],
  ["자동화 세팅도 해주나요?", "반복 문의, FAQ, 상담 스크립트, 운영 리포트에 필요한 자동화 방향을 함께 설계합니다. 실제 연동 범위는 사용하는 채널과 시스템에 따라 달라집니다."],
  ["계약 기간과 플랜 변경은 어떻게 되나요?", "운영 규모에 맞춰 시작한 뒤 상담량과 채널 변화에 따라 플랜을 조정할 수 있습니다. 자세한 조건은 진단 후 안내합니다."],
];

export function FAQSection() {
  return (
    <section id="faq" className="scroll-mt-24 bg-[#F7F6FF] py-24 sm:py-28">
      <div className="mx-auto max-w-[820px] px-6">
        <div className="text-center">
          <p className="text-sm font-extrabold tracking-[0.14em] text-[#5B47E0]">FAQ</p>
          <h2 className="mt-5 text-[34px] font-extrabold leading-[1.16] tracking-[-0.045em] text-[#0E1430] sm:text-[42px]">
            자주 묻는 질문
          </h2>
        </div>
        <div className="mt-12 divide-y divide-[#E2E6EF] overflow-hidden rounded-[28px] border border-[#E2E6EF] bg-white">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 text-left text-base font-extrabold text-[#0E1430] sm:px-8">
                {question}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F1EFFF] text-xl font-medium text-[#5B47E0] transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="px-6 pb-6 pr-14 text-[15px] leading-7 text-[#5F6685] sm:px-8">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
