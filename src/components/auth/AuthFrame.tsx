import Link from "next/link";
import type { ReactNode } from "react";

export function ReploWordmark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`replo-wordmark${inverse ? " inverse" : ""}`}>
      Replo<sup>+</sup>
    </span>
  );
}

export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link href="/" aria-label="Replo 홈">
          <ReploWordmark />
        </Link>
        <Link href="/" className="auth-home-link">
          홈으로 돌아가기
        </Link>
      </header>

      <section className="auth-layout">
        <div className="auth-message">
          <h2>
            더 선명한 고객 운영,
            <br />
            Replo에서 시작하세요.
          </h2>
          <p>문의 현황, 채널 연동, 운영 리포트를 하나의 워크스페이스에서 관리합니다.</p>
          <div className="auth-preview" aria-hidden="true">
            <div className="auth-preview-bar">
              <span />
              <span />
              <span />
            </div>
            <div className="auth-preview-body">
              <i />
              <div>
                <b />
                <b />
                <b />
              </div>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <Link href="/" className="auth-mobile-logo" aria-label="Replo 홈">
            <ReploWordmark />
          </Link>
          {children}
        </div>
      </section>
    </main>
  );
}
