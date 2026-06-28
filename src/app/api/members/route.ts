import { NextResponse } from "next/server";
import { getCurrentWorkspaceAccess } from "@/lib/workspaces/access";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const access = await getCurrentWorkspaceAccess();
  if (!access) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data: members, error: membersError }, { data: invites, error: invitesError }] =
    await Promise.all([
      admin
        .from("workspace_members")
        .select("id, user_id, role, status, last_seen_at, created_at")
        .eq("workspace_id", access.workspace.id)
        .order("created_at", { ascending: true }),
      admin
        .from("member_invites")
        .select("id, email, role, status, expires_at, created_at")
        .eq("workspace_id", access.workspace.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);
  if (membersError || invitesError) {
    return NextResponse.json({ error: "멤버 목록을 불러오지 못했습니다." }, { status: 500 });
  }

  const userIds = (members ?? []).map((member) => member.user_id);
  const { data: users } = userIds.length
    ? await admin
        .from("users")
        .select("id, name, email, avatar_url")
        .in("id", userIds)
    : { data: [] };
  const userMap = new Map((users ?? []).map((user) => [user.id, user]));

  return NextResponse.json({
    role: access.membership.role,
    members: (members ?? []).map((member) => ({
      ...member,
      name: userMap.get(member.user_id)?.name ?? "이름 미등록",
      email: userMap.get(member.user_id)?.email ?? "이메일 미등록",
      isCurrentUser: member.user_id === access.user.id,
    })),
    invites: invites ?? [],
  });
}
