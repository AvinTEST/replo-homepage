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
type WebhookStatus = "sent" | "failed" | "skipped";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function shortWebhookError(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 300);
  return String(error).slice(0, 300);
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
    const insertData = {
      business_type: businessType,
      monthly_inquiries: monthlyInquiries,
      main_pain: mainPain,
      company_name: companyName,
      contact_name: contactName,
      phone,
      work_email: workEmail,
      source: "homepage",
      status: "new",
      webhook_status: "pending",
    };

    const { data: insertedRow, error } = await supabase
      .from("diagnosis_responses")
      .insert(insertData)
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Diagnosis insert failed", error);
      return NextResponse.json(
        { ok: false, error: "데이터 저장 중 오류가 발생했습니다." },
        { status: 500 },
      );
    }

    if (!insertedRow) {
      console.error("Diagnosis insert returned no row");
      return NextResponse.json(
        { ok: false, error: "데이터 저장 중 오류가 발생했습니다." },
        { status: 500 },
      );
    }

    const updateWebhookStatus = async (
      webhookStatus: WebhookStatus,
      webhookError?: string,
    ) => {
      const updateData: {
        webhook_status: WebhookStatus;
        webhook_sent_at?: string;
        webhook_error: string | null;
      } = {
        webhook_status: webhookStatus,
        webhook_error: webhookError ?? null,
      };

      if (webhookStatus === "sent") {
        updateData.webhook_sent_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("diagnosis_responses")
        .update(updateData)
        .eq("id", insertedRow.id);

      if (updateError) {
        console.error("Diagnosis webhook status update failed", updateError);
      }
    };

    const webhookUrl = process.env.DIAGNOSIS_WEBHOOK_URL;

    if (!webhookUrl) {
      await updateWebhookStatus("skipped");
      return NextResponse.json({ ok: true, webhookStatus: "skipped" });
    }

    const webhookPayload = {
      event: "diagnosis_response.created",
      source: "replo_homepage",
      submittedAt: insertedRow.created_at ?? new Date().toISOString(),
      data: {
        id: insertedRow.id,
        businessType,
        monthlyInquiries,
        mainPain,
        companyName,
        contactName,
        phone,
        workEmail,
      },
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const webhookSecret = process.env.DIAGNOSIS_WEBHOOK_SECRET;
    if (webhookSecret) {
      headers["X-Replo-Webhook-Secret"] = webhookSecret;
    }

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(webhookPayload),
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook responded with ${webhookResponse.status}`);
      }

      await updateWebhookStatus("sent");
      return NextResponse.json({ ok: true, webhookStatus: "sent" });
    } catch (webhookError) {
      const message = shortWebhookError(webhookError);
      console.error("Diagnosis webhook failed", webhookError);
      await updateWebhookStatus("failed", message);
      return NextResponse.json({ ok: true, webhookStatus: "failed" });
    }
  } catch (error) {
    console.error("Diagnosis API failed", error);
    return NextResponse.json(
      { error: "서버 설정을 확인해 주세요." },
      { status: 500 },
    );
  }
}
