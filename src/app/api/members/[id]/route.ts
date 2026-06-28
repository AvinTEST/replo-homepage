import { NextResponse } from "next/server";
import {
  canManageWorkspace,
  getCurrentWorkspaceAccess,
  type WorkspaceRole,
} from "@/lib/workspaces/access";
import { createAdminClient } from "@/lib/supabase/admin";

const EDITABLE_ROLES: WorkspaceRole[] = ["owner", "admin", "editor", "viewer"];

async function targetMember(id: string, workspaceId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("workspace_members")
    .select("id, user_id, role")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return data;
}

async function ownerCount(workspaceId: string) {
  const admin = createAdminClient();
  const { count } = await admin
    .from("workspace_members")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("role", "owner")
    .eq("status", "active");
  return count ?? 0;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const access = await getCurrentWorkspaceAccess();
  if (!access) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!canManageWorkspace(access)) {
    return NextResponse.json({ error: "멤버 역할을 변경할 권한이 없습니다." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { role?: WorkspaceRole };
  if (!body.role || !EDITABLE_ROLES.includes(body.role)) {
    return NextResponse.json({ error: "올바른 역할을 선택해 주세요." }, { status: 400 });
  }

  const target = await targetMember(params.id, access.workspace.id);
  if (!target) return NextResponse.json({ error: "멤버를 찾을 수 없습니다." }, { status: 404 });
  if (
    access.membership.role !== "owner" &&
    (target.role === "owner" || body.role === "owner" || body.role === "admin")
  ) {
    return NextResponse.json({ error: "owner만 해당 역할을 변경할 수 있습니다." }, { status: 403 });
  }
  if (target.role === "owner" && body.role !== "owner" && (await ownerCount(access.workspace.id)) <= 1) {
    return NextResponse.json({ error: "마지막 owner의 역할은 변경할 수 없습니다." }, { status: 409 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("workspace_members")
    .update({ role: body.role, updated_at: new Date().toISOString() })
    .eq("id", target.id);
  if (error) return NextResponse.json({ error: "역할을 변경하지 못했습니다." }, { status: 500 });

  await admin.from("audit_logs").insert({
    workspace_id: access.workspace.id,
    actor_user_id: access.user.id,
    action: "member.role_updated",
    target_type: "customer_member",
    target_id: target.id,
    metadata: { previous_role: target.role, role: body.role },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const access = await getCurrentWorkspaceAccess();
  if (!access) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!canManageWorkspace(access)) {
    return NextResponse.json({ error: "멤버를 삭제할 권한이 없습니다." }, { status: 403 });
  }

  const target = await targetMember(params.id, access.workspace.id);
  if (!target) return NextResponse.json({ error: "멤버를 찾을 수 없습니다." }, { status: 404 });
  if (target.user_id === access.user.id) {
    return NextResponse.json({ error: "현재 로그인한 계정은 직접 삭제할 수 없습니다." }, { status: 409 });
  }
  if (target.role === "owner" && (access.membership.role !== "owner" || (await ownerCount(access.workspace.id)) <= 1)) {
    return NextResponse.json({ error: "해당 owner를 삭제할 수 없습니다." }, { status: 409 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("workspace_members").delete().eq("id", target.id);
  if (error) return NextResponse.json({ error: "멤버를 삭제하지 못했습니다." }, { status: 500 });

  await admin.from("audit_logs").insert({
    workspace_id: access.workspace.id,
    actor_user_id: access.user.id,
    action: "member.deleted",
    target_type: "customer_member",
    target_id: target.id,
    metadata: { user_id: target.user_id, role: target.role },
  });
  return NextResponse.json({ ok: true });
}
