import Link from "next/link";

export const metadata = {
  title: "운영 진단 신청 완료 | Replo",
  description: "Replo 운영 진단 신청이 정상적으로 접수되었습니다.",
};

export default function ContactSuccessPage() {
  return (
    <main className="diagnosis-page">
      <div className="diagnosis-shell diagnosis-success-shell">
        <nav className="diagnosis-nav" aria-label="신청 완료 내비게이션">
          <Link href="/" className="diagnosis-logo" aria-label="Replo 홈">
            Replo<sup>+</sup>
          </Link>
        </nav>

        <section className="diagnosis-card diagnosis-success" aria-live="polite">
          <span className="diagnosis-kicker">접수 완료</span>
          <h1>운영 진단 신청이 완료되었습니다.</h1>
          <p>
            입력해 주신 내용을 바탕으로 Replo 팀이 확인 후 연락드리겠습니다.
          </p>
          <Link href="/" className="diagnosis-submit diagnosis-link-button">
            홈으로 돌아가기
          </Link>
        </section>
      </div>
    </main>
  );
}
