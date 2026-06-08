export function HomeHero() {
  return (
    <section id="top" className="relative overflow-hidden bg-[#F7F6FF]">
      <div className="absolute left-1/2 top-[-340px] h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-[#E6E0FF] blur-3xl" />
      <div className="relative mx-auto flex min-h-[690px] max-w-[1180px] flex-col items-center justify-center px-6 py-24 text-center sm:py-28">
        <p className="text-sm font-extrabold tracking-[0.12em] text-[#5B47E0]">
          CS 운영 구독 서비스 - AI + 전문가 + 시스템
        </p>
        <h1 className="mt-7 max-w-[900px] text-[40px] font-extrabold leading-[1.08] tracking-[-0.065em] text-[#0E1430] sm:text-[58px] sm:tracking-[-0.055em] lg:text-[68px]">
          상담원 채용 대신
          <br />
          고객센터 운영을 구독하세요
        </h1>
        <p className="mt-8 max-w-[760px] text-base font-medium leading-8 text-[#5F6685] sm:text-lg">
          채용, 교육, QA, 운영 리포트, AI 자동화까지. 고객센터 운영에 필요한 모든 것을 Replo가 설계하고 운영합니다.
        </p>
        <div className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <a
            href="/diagnosis"
            className="inline-flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#5B47E0] px-7 text-base font-bold text-white shadow-[0_14px_32px_rgba(91,71,224,0.24)] transition hover:bg-[#4D3BC7] sm:w-auto"
          >
            무료 운영 진단 받기
          </a>
          <a
            href="#service"
            className="inline-flex h-[52px] w-full items-center justify-center rounded-2xl border border-[#D8DDE8] bg-white px-7 text-base font-bold text-[#2C3357] transition hover:border-[#5B47E0] hover:text-[#5B47E0] sm:w-auto"
          >
            서비스 소개 보기
          </a>
        </div>
      </div>
    </section>
  );
}
