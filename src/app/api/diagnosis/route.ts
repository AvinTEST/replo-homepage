import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type DiagnosisPayload = {
  businessType?: unknown;
  monthlyInquiries?: unknown;
  mainPain?: unknown;
  companyName?: unknown;
  websiteUrl?: unknown;
  contactName?: unknown;
  phone?: unknown;
  workEmail?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hostnamePattern =
  /^(?=.{4,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
type WebhookStatus = "sent" | "failed" | "skipped";
const rateLimitWindowMs = 10 * 60 * 1000;
const maxRequestsPerWindow = 5;
const diagnosisRateLimit = new Map<string, { count: number; resetAt: number }>();

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeWebsiteUrl(value: string) {
  const input = value.trim();
  const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;

  try {
    const url = new URL(withProtocol);
    const hostname = url.hostname.toLowerCase();
    if (!["http:", "https:"].includes(url.protocol)) return "";
    if (!hostnamePattern.test(hostname)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function shortWebhookError(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 300);
  return String(error).slice(0, 300);
}

function clientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(request: Request) {
  const now = Date.now();
  const key = clientIp(request);
  const current = diagnosisRateLimit.get(key);

  if (!current || current.resetAt <= now) {
    diagnosisRateLimit.set(key, {
      count: 1,
      resetAt: now + rateLimitWindowMs,
    });
    return false;
  }

  current.count += 1;
  diagnosisRateLimit.set(key, current);
  return current.count > maxRequestsPerWindow;
}

export async function POST(request: Request) {
  let payload: DiagnosisPayload;

  if (isRateLimited(request)) {
    return NextResponse.json(
      { error: "요청이 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 },
    );
  }

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
  const websiteUrlInput = clean(payload.websiteUrl);
  const contactName = clean(payload.contactName);
  const phone = clean(payload.phone);
  const workEmail = clean(payload.workEmail);
  const websiteUrl = normalizeWebsiteUrl(websiteUrlInput);

  if (
    !businessType ||
    !monthlyInquiries ||
    !mainPain ||
    !companyName ||
    !websiteUrlInput ||
    !contactName ||
    !phone ||
    !workEmail
  ) {
    return NextResponse.json(
      { error: "모든 항목을 입력해 주세요." },
      { status: 400 },
    );
  }

  if (!websiteUrl) {
    return NextResponse.json(
      { error: "홈페이지 주소 형식을 확인해 주세요." },
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
      website_url: websiteUrl,
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
        websiteUrl,
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
