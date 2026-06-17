import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import {
  canManageCustomer,
  getCurrentCustomerAccess,
  type CustomerRole,
} from "@/lib/customers/access";
import { getAuthCallbackUrl } from "@/lib/auth/redirect";
import { createAdminClient } from "@/lib/supabase/admin";

const INVITABLE_ROLES: CustomerRole[] = ["admin", "editor", "viewer"];

export async function POST(request: Request) {
  const access = await getCurrentCustomerAccess();
  if (!access) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!canManageCustomer(access)) {
    return NextResponse.json({ error: "멤버를 초대할 권한이 없습니다." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    role?: CustomerRole;
  };
  const email = body.email?.trim().toLowerCase() ?? "";
  const role = body.role;
  if (!email || !role || !INVITABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "이메일과 올바른 역할을 입력해 주세요." }, { status: 400 });
  }
  if (access.membership.role === "admin" && role === "admin") {
    return NextResponse.json({ error: "관리자는 다른 관리자를 초대할 수 없습니다." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("user_id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();
  if (profile) {
    const { data: existingMember } = await admin
      .from("customer_members")
      .select("id")
      .eq("customer_id", access.customer.id)
      .eq("user_id", profile.user_id)
      .maybeSingle();
    if (existingMember) {
      return NextResponse.json({ error: "이미 등록된 멤버입니다." }, { status: 409 });
    }
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: invite, error } = await admin
    .from("member_invites")
    .upsert(
      {
        customer_id: access.customer.id,
        email,
        role,
        token_hash: tokenHash,
        status: "pending",
        expires_at: expiresAt,
        invited_by: access.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "customer_id,email" },
    )
    .select("id")
    .single();
  if (error || !invite) {
    return NextResponse.json({ error: "멤버 초대를 만들지 못했습니다." }, { status: 500 });
  }

  const { error: authInviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: getAuthCallbackUrl(),
    data: {
      customer_id: access.customer.id,
      invited_role: role,
    },
  });

  await admin.from("audit_logs").insert({
    customer_id: access.customer.id,
    actor_user_id: access.user.id,
    action: "member.invited",
    target_type: "member_invite",
    target_id: invite.id,
    metadata: { email, role, email_delivery: authInviteError ? "pending_login" : "sent" },
  });

  return NextResponse.json({
    ok: true,
    message: authInviteError
      ? "초대가 등록되었습니다. 기존 사용자는 Google 로그인 후 참여할 수 있습니다."
      : "초대 메일을 보냈습니다.",
  });
}
