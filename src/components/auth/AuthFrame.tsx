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
            CS가 더 쉬워지는 곳,
            <br />
            Replo
          </h2>
          <p>AI와 전문 운영팀으로 CS 운영 비용은 낮추고 고객 경험은 높입니다.</p>
          <div className="auth-preview" aria-hidden="true">
            <div className="auth-preview-header">
              <div>
                <span>운영 대시보드</span>
                <strong>이번 달 고객 운영 현황</strong>
              </div>
              <small>최근 30일</small>
            </div>
            <div className="auth-preview-metrics">
              <div>
                <span>처리 문의</span>
                <strong>12,430</strong>
                <small>지난달 대비 8.4% 감소</small>
              </div>
              <div>
                <span>전화 응대율</span>
                <strong>92.1%</strong>
                <small>목표 응대율 달성</small>
              </div>
              <div>
                <span>플랜 사용량</span>
                <strong>62%</strong>
                <small>12,430 / 20,000건</small>
              </div>
            </div>
            <div className="auth-preview-charts">
              <div className="auth-mini-chart">
                <span>문의 처리 추이</span>
                <svg viewBox="0 0 280 92">
                  <path d="M4 72 C34 64 48 70 72 53 S116 58 140 38 S184 50 210 26 S252 36 276 14" />
                  <line x1="4" x2="276" y1="82" y2="82" />
                </svg>
              </div>
              <div className="auth-channel-list">
                <span>채널별 문의</span>
                <div className="auth-channel-row">
                  <b>채널톡</b>
                  <i><em style={{ width: "82%" }} /></i>
                </div>
                <div className="auth-channel-row">
                  <b>이메일</b>
                  <i><em style={{ width: "57%" }} /></i>
                </div>
                <div className="auth-channel-row">
                  <b>전화</b>
                  <i><em style={{ width: "36%" }} /></i>
                </div>
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
