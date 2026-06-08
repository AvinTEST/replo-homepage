import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type DiagnosisPayload = {
  businessType?: unknown;
  monthlyInquiries?: unknown;
  mainPain?: unknown;
  companyName?: unknown;
  contactName?: unknown;
  phone?: unknown;
  workEmail?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let payload: DiagnosisPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const businessType = clean(payload.businessType);
  const monthlyInquiries = clean(payload.monthlyInquiries);
  const mainPain = clean(payload.mainPain);
  const companyName = clean(payload.companyName);
  const contactName = clean(payload.contactName);
  const phone = clean(payload.phone);
  const workEmail = clean(payload.workEmail);

  if (
    !businessType ||
    !monthlyInquiries ||
    !mainPain ||
    !companyName ||
    !contactName ||
    !phone ||
    !workEmail
  ) {
    return NextResponse.json(
      { error: "모든 항목을 입력해 주세요." },
      { status: 400 },
    );
  }

  if (!emailPattern.test(workEmail)) {
    return NextResponse.json(
      { error: "직장 이메일 형식을 확인해 주세요." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("diagnosis_responses").insert({
      business_type: businessType,
      monthly_inquiries: monthlyInquiries,
      main_pain: mainPain,
      company_name: companyName,
      contact_name: contactName,
      phone,
      work_email: workEmail,
      source: "homepage",
      status: "new",
    });

    if (error) {
      console.error("Diagnosis insert failed", error);
      return NextResponse.json(
        { error: "운영 진단 신청 저장 중 오류가 발생했습니다." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Diagnosis API failed", error);
    return NextResponse.json(
      { error: "서버 설정을 확인해 주세요." },
      { status: 500 },
    );
  }
}
