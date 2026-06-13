import { NextResponse } from "next/server";
import {
  createAdminClient,
  SupabaseAdminConfigurationError,
} from "@/lib/supabase/admin";
import {
  checkDiagnosisRateLimit,
} from "@/lib/rateLimit/diagnosis";

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
const webhookTimeoutMs = 10_000;

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

export async function POST(request: Request) {
  let payload: DiagnosisPayload;
  const requestId = crypto.randomUUID();

  try {
    const rateLimit = await checkDiagnosisRateLimit(request);
    if (rateLimit.limited) {
      return NextResponse.json(
        { error: "요청이 많습니다. 잠시 후 다시 시도해 주세요." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }
  } catch (error) {
    console.error("Diagnosis rate limiter unavailable", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "운영 진단 접수가 일시적으로 지연되고 있습니다." },
      { status: 503 },
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
    const adminClient = createAdminClient();
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const webhookUrl = process.env.DIAGNOSIS_WEBHOOK_URL;
    const insertData = {
      id,
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
      webhook_status: webhookUrl ? "failed" : "skipped",
      webhook_error: webhookUrl
        ? "Webhook delivery has not completed"
        : null,
      created_at: createdAt,
    };

    const { error } = await adminClient
      .from("diagnosis_responses")
      .insert(insertData);

    if (error) {
      console.error("Diagnosis lead persistence failed", {
        requestId,
        leadId: id,
        code: error.code,
        message: error.message,
        details: error.details,
      });
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

      try {
        const { error: updateError } = await adminClient
          .from("diagnosis_responses")
          .update(updateData)
          .eq("id", id);

        if (updateError) {
          console.error("Diagnosis webhook status update failed", {
            requestId,
            leadId: id,
            targetStatus: webhookStatus,
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
          });
          return false;
        }
        return true;
      } catch (updateError) {
        console.error("Diagnosis webhook status update threw", {
          requestId,
          leadId: id,
          targetStatus: webhookStatus,
          error:
            updateError instanceof Error
              ? updateError.message
              : String(updateError),
        });
        return false;
      }
    };

    if (!webhookUrl) {
      return NextResponse.json({ ok: true, webhookStatus: "skipped" });
    }

    const webhookPayload = {
      event: "diagnosis_response.created",
      source: "replo_homepage",
      submittedAt: createdAt,
      data: {
        id,
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
        signal: AbortSignal.timeout(webhookTimeoutMs),
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook responded with ${webhookResponse.status}`);
      }

      const statusUpdated = await updateWebhookStatus("sent");
      return NextResponse.json(
        {
          ok: true,
          webhookStatus: statusUpdated ? "sent" : "failed",
          warning: statusUpdated ? undefined : "webhook_status_update_failed",
        },
        { status: statusUpdated ? 200 : 202 },
      );
    } catch (webhookError) {
      const message = shortWebhookError(webhookError);
      console.error("Diagnosis webhook delivery failed", {
        requestId,
        leadId: id,
        error: message,
      });
      const statusUpdated = await updateWebhookStatus("failed", message);
      return NextResponse.json(
        {
          ok: true,
          webhookStatus: "failed",
          warning: statusUpdated ? undefined : "webhook_status_update_failed",
        },
        { status: statusUpdated ? 200 : 202 },
      );
    }
  } catch (error) {
    const isConfigurationError =
      error instanceof SupabaseAdminConfigurationError;
    console.error("Diagnosis API failed", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      {
        error: isConfigurationError
          ? "운영 진단 접수 설정을 확인해 주세요."
          : "데이터 저장 중 오류가 발생했습니다.",
      },
      { status: isConfigurationError ? 503 : 500 },
    );
  }
}
