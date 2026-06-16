"use client";

import { useEffect } from "react";

export default function RedirectHome() {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      window.location.assign("/");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return <p className="diagnosis-redirect-note">3초 뒤 홈페이지로 이동합니다.</p>;
}
