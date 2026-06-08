const navigation = [
  { label: "점검", href: "#problem" },
  { label: "서비스", href: "#service" },
  { label: "방식", href: "#process" },
  { label: "비용", href: "#cost" },
  { label: "요금제", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function HomeHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-6">
        <a
          href="#top"
          className="inline-flex items-center gap-1 text-[22px] font-extrabold tracking-[-0.045em] text-[#0E1430]"
          aria-label="Replo 홈"
        >
          Replo
          <span className="text-[#5B47E0]">+</span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="주요 메뉴">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[15px] font-semibold text-[#2C3357] transition-colors hover:text-[#5B47E0]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href="/diagnosis"
          className="inline-flex h-9 items-center justify-center rounded-xl bg-[#5B47E0] px-4 text-[13px] font-bold text-white shadow-[0_8px_24px_rgba(91,71,224,0.22)] transition hover:bg-[#4D3BC7] focus:outline-none focus:ring-2 focus:ring-[#5B47E0] focus:ring-offset-2 sm:h-10 sm:px-5"
        >
          무료 진단 받기
        </a>
      </div>
    </header>
  );
}
