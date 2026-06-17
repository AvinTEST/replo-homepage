import { NextResponse } from "next/server";
import { sendMetaCapiEvent } from "@/lib/meta/server";

const allowedEvents = new Set(["Lead", "CompleteRegistration", "complete_onboarding"]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const eventName = typeof body.eventName === "string" ? body.eventName : "";
  const eventId = typeof body.eventId === "string" ? body.eventId : "";

  if (!allowedEvents.has(eventName) || !eventId) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const result = await sendMetaCapiEvent({
    eventName,
    eventId,
    eventSourceUrl: typeof body.eventSourceUrl === "string" ? body.eventSourceUrl : undefined,
    customData:
      body.customData && typeof body.customData === "object"
        ? (body.customData as Record<string, unknown>)
        : {},
    userData:
      body.userData && typeof body.userData === "object"
        ? (body.userData as Record<string, unknown>)
        : {},
    request,
  });

  return NextResponse.json({ ok: true, meta: result });
}
