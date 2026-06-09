import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F6FF] px-6 py-16">
      <section className="w-full max-w-2xl rounded-[32px] border border-[#E6E1FF] bg-white px-6 py-14 text-center shadow-[0_24px_70px_rgba(48,35,120,0.12)] sm:px-12">
        <Link
          href="/"
          className="text-2xl font-black tracking-[-0.04em] text-[#5B47E0]"
          aria-label="Replo 홈"
        >
          Replo<sup>+</sup>
        </Link>
        <p className="mt-10 text-sm font-bold uppercase tracking-[0.18em] text-[#6D5CE7]">
          404 Not Found
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#10162F] sm:text-5xl">
          요청하신 페이지를 찾을 수 없습니다.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-[#68718A] sm:text-lg">
          주소가 변경되었거나 페이지가 존재하지 않습니다. 홈페이지로 돌아가거나
          무료 운영 진단을 시작해 보세요.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#D9D3FF] bg-white px-6 py-3 font-bold text-[#4F3DCE]"
          >
            홈으로 돌아가기
          </Link>
          <Link
            href="/diagnosis"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#5B47E0] px-6 py-3 font-bold text-white"
          >
            무료 운영 진단 받기
          </Link>
        </div>
      </section>
    </main>
  );
}
