export function FinalCTASection() {
  return (
    <>
      <section className="bg-white px-6 py-24 sm:py-28">
        <div className="mx-auto max-w-[920px] overflow-hidden rounded-[36px] bg-[#5B47E0] px-6 py-16 text-center text-white shadow-[0_24px_70px_rgba(91,71,224,0.24)] sm:px-12 sm:py-20">
          <p className="text-sm font-extrabold tracking-[0.14em] text-[#DCD6FF]">무료 운영 진단</p>
          <h2 className="mt-5 text-[34px] font-extrabold leading-[1.16] tracking-[-0.045em] sm:text-[42px]">
            고객센터 운영,
            <br />
            이제 시스템으로 관리하세요.
          </h2>
          <p className="mx-auto mt-5 max-w-[620px] text-base leading-7 text-[#ECE9FF]">
            URL 하나만 보내주시면 현재 고객센터 운영 구조를 진단하고, 가장 먼저 정리해야 할 기준을 안내해 드립니다.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="/contact" className="inline-flex h-[52px] items-center justify-center rounded-2xl bg-white px-7 text-base font-extrabold text-[#5B47E0]">
              무료 운영 진단 받기
            </a>
            <a href="/contact" className="inline-flex h-[52px] items-center justify-center rounded-2xl border border-white/30 px-7 text-base font-extrabold text-white">
              서비스 문의하기
            </a>
          </div>
        </div>
      </section>
      <footer className="border-t border-[#E2E6EF] bg-white">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-6 py-9 text-sm text-[#7B8198] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xl font-extrabold tracking-[-0.04em] text-[#0E1430]">
            Replo<span className="text-[#5B47E0]">+</span>
          </p>
          <p>고객센터 운영을 더 단순하고 명확하게.</p>
          <div className="flex flex-col gap-1 sm:items-end">
            <a className="hover:text-[#5B47E0]" href="mailto:sales@replo.kr">sales@replo.kr</a>
            <a className="hover:text-[#5B47E0]" href="tel:010-8006-5444">010-8006-5444</a>
          </div>
        </div>
      </footer>
    </>
  );
}
