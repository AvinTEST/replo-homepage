"use client";

import { useState } from "react";

export default function PaymentMethodPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleChangePaymentMethod() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/billing/change-payment-method", {
        method: "POST",
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setMessage(data.error ?? "결제수단 변경 요청에 실패했습니다.");
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setMessage("결제수단 변경 요청이 접수되었습니다.");
    } catch (e) {
      setLoading(false);
      setMessage("결제수단 변경 요청 중 오류가 발생했습니다.");
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F6FF] px-6 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-gray-900">결제수단 변경</h1>
        <p className="mt-3 text-gray-600">
          카드 정보는 Replo에 직접 저장하지 않습니다. 안전한 결제사 페이지를 통해
          결제수단을 변경합니다.
        </p>
        <button
          onClick={handleChangePaymentMethod}
          disabled={loading}
          className="mt-8 rounded-xl bg-[#5B47E0] px-5 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "요청 중..." : "결제수단 변경 시작하기"}
        </button>
        {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
      </div>
    </main>
  );
}