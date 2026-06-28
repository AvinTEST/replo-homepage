import { NextResponse } from "next/server";
import { ChannelTalkConnector } from "@/lib/connectors/channelTalkConnector";
import {
  canManageWorkspace,
  getCurrentWorkspaceAccess,
} from "@/lib/workspaces/access";
import {
  encryptedChannelTalkCredentials,
  getWorkspaceIntegration,
} from "@/lib/integrations/workspaceIntegrations";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const access = await getCurrentWorkspaceAccess();
  if (!access) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!canManageWorkspace(access)) {
    return NextResponse.json({ error: "연동을 수정할 권한이 없습니다." }, { status: 403 });
  }

  const integration = await getWorkspaceIntegration(access.workspace.id, params.id);
  if (!integration) {
    return NextResponse.json({ error: "연동 정보를 찾을 수 없습니다." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    brandName?: string;
    channelName?: string;
    accessKey?: string;
    accessSecret?: string;
    status?: "connected" | "paused";
  };
  const accessKey = body.accessKey?.trim();
  const accessSecret = body.accessSecret?.trim();
  if ((accessKey && !accessSecret) || (!accessKey && accessSecret)) {
    return NextResponse.json(
      { error: "Access Key와 Access Secret은 함께 입력해 주세요." },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();
    let brandId = integration.brand_id;
    if (body.brandName?.trim()) {
      const { data: brand, error } = await admin
        .from("brands")
        .upsert(
          {
            workspace_id: access.workspace.id,
            name: body.brandName.trim().slice(0, 200),
            status: "active",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "workspace_id,name" },
        )
        .select("id")
        .single();
      if (error || !brand) throw error ?? new Error("브랜드 수정 실패");
      brandId = brand.id;
    }

    const update: Record<string, unknown> = {
      brand_id: brandId,
      channel_name: body.channelName?.trim().slice(0, 200) || integration.channel_name,
      display_name: body.channelName?.trim().slice(0, 200) || integration.display_name,
      status: body.status ?? integration.status,
      updated_at: new Date().toISOString(),
    };
    if (accessKey && accessSecret) {
      await new ChannelTalkConnector({ accessKey, accessSecret }).testConnection();
      Object.assign(update, encryptedChannelTalkCredentials(accessKey, accessSecret), {
        status: "connected",
        last_checked_at: new Date().toISOString(),
        last_error: null,
      });
    }

    const { error } = await admin
      .from("channel_integrations")
      .update(update)
      .eq("id", integration.id)
      .eq("workspace_id", access.workspace.id);
    if (error) throw error;

    await admin.from("audit_logs").insert({
      workspace_id: access.workspace.id,
      actor_user_id: access.user.id,
      action: "integration.updated",
      target_type: "channel_integration",
      target_id: integration.id,
      metadata: { credentials_rotated: Boolean(accessKey && accessSecret) },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "연동을 수정하지 못했습니다." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const access = await getCurrentWorkspaceAccess();
  if (!access) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!canManageWorkspace(access)) {
    return NextResponse.json({ error: "연동을 삭제할 권한이 없습니다." }, { status: 403 });
  }

  const integration = await getWorkspaceIntegration(access.workspace.id, params.id);
  if (!integration) {
    return NextResponse.json({ error: "연동 정보를 찾을 수 없습니다." }, { status: 404 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("channel_integrations")
    .delete()
    .eq("id", integration.id)
    .eq("workspace_id", access.workspace.id);
  if (error) return NextResponse.json({ error: "연동을 삭제하지 못했습니다." }, { status: 500 });

  await admin.from("audit_logs").insert({
    workspace_id: access.workspace.id,
    actor_user_id: access.user.id,
    action: "integration.deleted",
    target_type: "channel_integration",
    target_id: integration.id,
    metadata: { channel_name: integration.channel_name },
  });
  return NextResponse.json({ ok: true });
}
