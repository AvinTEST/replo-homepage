"use client";

import Link from "next/link";
import { useState } from "react";

export function PaymentMethodRequest({
  hasSubscription,
}: {
  hasSubscription: boolean;
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestChange() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/billing/change-payment-method", {
        method: "POST",
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        mode?: "manual" | "steppay";
        redirectUrl?: string;
      };
      if (!response.ok) {
        setMessage(body.error ?? "결제수단 변경 요청을 접수하지 못했습니다.");
        return;
      }
      if (body.mode === "steppay" && body.redirectUrl) {
        window.location.assign(body.redirectUrl);
        return;
      }
      setMessage(
        body.message ??
          "결제수단 변경 요청이 접수되었습니다. 운영팀 확인 후 안내드리겠습니다.",
      );
    } catch {
      setMessage("결제수단 변경 요청을 접수하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F6FF] px-6 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold text-[#5B47E0]">Billing request</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          결제수단 변경 요청
        </h1>
        <p className="mt-3 leading-7 text-gray-600">
          카드 정보는 Replo가 직접 수집하거나 저장하지 않습니다. 현재는 운영팀이
          구독 상태를 확인한 뒤 안전한 변경 절차를 안내합니다.
        </p>
        {!hasSubscription ? (
          <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            아직 활성 구독 정보가 없어 상담 요청으로 접수됩니다.
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void requestChange()}
            disabled={loading}
            className="rounded-xl bg-[#5B47E0] px-5 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "요청 중..." : "결제수단 변경 요청하기"}
          </button>
          <Link
            href="/mypage#billing"
            className="inline-flex rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-700"
          >
            마이페이지로 돌아가기
          </Link>
        </div>
        {message ? (
          <p className="mt-5 rounded-xl bg-[#F7F6FF] px-4 py-3 text-sm text-[#4935C8]" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}
