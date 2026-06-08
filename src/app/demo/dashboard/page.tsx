const demoCustomer = {
  company: "마제스티바버샵",
  contact: "백하은 대표님",
  email: "demo@replo.kr",
  plan: "500건 플랜",
  monthlyFee: "990,000원",
  includedTickets: "500건",
  status: "이용 중",
  nextBillingDate: "2026-07-01",
  paymentMethod: "현대카드 **** 1234",
};

const billingEvents = [
  "결제수단 변경 요청 생성",
  "500건 플랜 구독 활성화",
  "고객 계정 생성",
];

const summaryItems = [
  { label: "현재 플랜", value: demoCustomer.plan },
  { label: "월 이용료", value: demoCustomer.monthlyFee },
  { label: "포함 문의량", value: demoCustomer.includedTickets },
  { label: "구독 상태", value: demoCustomer.status },
];

export default function DemoDashboardPage() {
  return (
    <main className="min-h-screen bg-[#F7F6FF] px-4 py-5 text-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div className="rounded-lg border border-[#5B47E0]/20 bg-white px-4 py-3 text-sm font-semibold text-[#5B47E0] shadow-sm">
          데모 화면입니다. 실제 고객 데이터가 아닙니다.
        </div>

        <section className="overflow-hidden rounded-lg bg-[#5B47E0] text-white shadow-sm">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.45fr_1fr] lg:items-end">
            <div>
              <p className="text-sm font-medium text-white/75">Replo 고객 포털</p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                {demoCustomer.company}
              </h1>
              <div className="mt-6 grid gap-3 text-sm text-white/85 sm:grid-cols-2">
                <div>
                  <p className="text-white/60">담당자</p>
                  <p className="mt-1 font-semibold text-white">
                    {demoCustomer.contact}
                  </p>
                </div>
                <div>
                  <p className="text-white/60">연락처 이메일</p>
                  <p className="mt-1 break-all font-semibold text-white">
                    {demoCustomer.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-white/12 p-5 ring-1 ring-white/20">
              <p className="text-sm text-white/70">다음 결제일</p>
              <p className="mt-2 text-2xl font-bold">
                {demoCustomer.nextBillingDate}
              </p>
              <p className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#5B47E0]">
                {demoCustomer.status}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item) => (
            <div key={item.label} className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">{item.label}</p>
              <p className="mt-3 text-2xl font-bold text-gray-950">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">결제수단</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-950">
                  {demoCustomer.paymentMethod}
                </h2>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  결제수단 변경은 향후 StepPay 또는 호스팅 결제 페이지를 통해
                  진행될 예정입니다.
                </p>
              </div>
              <span className="inline-flex w-fit rounded-full bg-[#F7F6FF] px-3 py-1 text-sm font-semibold text-[#5B47E0]">
                정상
              </span>
            </div>
            <button
              type="button"
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[#5B47E0] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#4937C8] sm:w-auto"
            >
              결제수단 변경하기
            </button>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">최근 청구 이벤트</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-950">
                  Billing history
                </h2>
              </div>
            </div>
            <ol className="mt-6 space-y-4">
              {billingEvents.map((event, index) => (
                <li key={event} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F7F6FF] text-sm font-bold text-[#5B47E0]">
                    {index + 1}
                  </span>
                  <div className="min-w-0 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <p className="font-semibold text-gray-950">{event}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {index === 0 ? "2026-06-08" : index === 1 ? "2026-06-01" : "2026-05-28"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
