import { NextResponse } from "next/server";
import { getCurrentCustomerAccess } from "@/lib/customers/access";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const access = await getCurrentCustomerAccess();
  if (!access) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data: members, error: membersError }, { data: invites, error: invitesError }] =
    await Promise.all([
      admin
        .from("customer_members")
        .select("id, user_id, role, status, last_seen_at, created_at")
        .eq("customer_id", access.customer.id)
        .order("created_at", { ascending: true }),
      admin
        .from("member_invites")
        .select("id, email, role, status, expires_at, created_at")
        .eq("customer_id", access.customer.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);
  if (membersError || invitesError) {
    return NextResponse.json({ error: "멤버 목록을 불러오지 못했습니다." }, { status: 500 });
  }

  const userIds = (members ?? []).map((member) => member.user_id);
  const { data: profiles } = userIds.length
    ? await admin
        .from("profiles")
        .select("user_id, name, email, avatar_url")
        .in("user_id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));

  return NextResponse.json({
    role: access.membership.role,
    members: (members ?? []).map((member) => ({
      ...member,
      name: profileMap.get(member.user_id)?.name ?? "이름 미등록",
      email: profileMap.get(member.user_id)?.email ?? "이메일 미등록",
      isCurrentUser: member.user_id === access.user.id,
    })),
    invites: invites ?? [],
  });
}
