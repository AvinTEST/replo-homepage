import Link from "next/link";
import type { ReactNode } from "react";

function BrandMark() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Replo 홈">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg font-black text-[#5B47E0] shadow-sm">
        R
        <span className="absolute -right-1 -top-1 text-sm text-[#8B7CF6]">+</span>
      </span>
      <span className="text-xl font-black tracking-[-0.04em] text-white">Replo</span>
    </Link>
  );
}

const benefits = [
  "고객 문의 운영 현황을 한 화면에서 확인",
  "브랜드별 채널톡 연결과 멤버 권한 관리",
  "플랜, 결제, 응대 기준을 마이페이지에서 관리",
];

export function AuthFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F5F4FF] text-[#111827] lg:grid lg:grid-cols-[minmax(420px,0.92fr)_minmax(540px,1.08fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#5B47E0] px-12 py-10 text-white lg:flex lg:flex-col">
        <div
          className="absolute inset-0 opacity-[0.14]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.55) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        <div className="absolute -left-28 top-1/3 h-80 w-80 rounded-full bg-[#7767ED] blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 right-[-80px] h-96 w-96 rounded-full bg-[#4430C8] blur-3xl" aria-hidden="true" />

        <div className="relative z-10">
          <BrandMark />
        </div>
        <div className="relative z-10 my-auto max-w-xl py-16">
          <p className="text-sm font-bold tracking-[0.08em] text-white/65">REPLO CUSTOMER WORKSPACE</p>
          <h2 className="mt-6 text-[46px] font-black leading-[1.15] tracking-[-0.045em]">
            고객센터 운영을
            <br />
            더 선명하게 관리하세요.
          </h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/72">
            고객 문의 현황부터 브랜드별 채널 연동, 멤버 권한과 결제 정보까지 Replo에서
            관리할 수 있습니다.
          </p>
          <ul className="mt-10 space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-sm font-semibold text-white/90">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/14" aria-hidden="true">
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none">
                    <path d="m5 10.2 3.1 3.1L15.3 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-xs text-white/45">
          Replo는 고객사의 카드 원문 정보나 비밀번호를 직접 저장하지 않습니다.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-[480px]">
          <div className="mb-9 flex items-center justify-between lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Replo 홈">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#5B47E0] text-lg font-black text-white">
                R
                <span className="absolute -right-1 -top-1 text-sm text-[#8B7CF6]">+</span>
              </span>
              <span className="text-xl font-black tracking-[-0.04em] text-[#17132F]">Replo</span>
            </Link>
            <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-[#5B47E0]">
              홈으로
            </Link>
          </div>

          <div className="rounded-[28px] border border-[#E5E2F5] bg-white px-6 py-8 shadow-[0_24px_70px_rgba(61,45,148,0.12)] sm:px-10 sm:py-10">
            <h1 className="text-[30px] font-black tracking-[-0.04em] text-[#17132F]">{title}</h1>
            <p className="mt-3 text-[15px] leading-6 text-slate-500">{description}</p>
            {children}
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            계속 진행하면 Replo의 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </section>
    </main>
  );
}
