"use client";

import { AuthFrame } from "@/components/auth/AuthFrame";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const authError =
    searchParams?.error === "auth_failed"
      ? "Google 인증을 완료하지 못했습니다. 다시 시도해 주세요."
      : "";

  return (
    <AuthFrame>
      <h1>고객 운영을 한곳에서 관리하세요.</h1>
      <p className="auth-description">
        Google 계정으로 로그인하면 Replo 워크스페이스로 이동합니다.
      </p>
      {authError ? (
        <p className="auth-error" role="alert">
          {authError}
        </p>
      ) : null}
      <div className="auth-action">
        <GoogleAuthButton label="Google로 계속하기" />
      </div>
      <p className="auth-note">
        처음 로그인하는 경우 회사와 브랜드 정보를 등록한 뒤 대시보드를 시작합니다.
      </p>
    </AuthFrame>
  );
}
