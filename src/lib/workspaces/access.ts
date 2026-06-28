import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionClaims } from "@/lib/supabase/claims";
import { createClient } from "@/lib/supabase/server";

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export type WorkspaceAccess = {
  user: { id: string; email: string | null };
  membership: {
    id: string;
    workspace_id: string;
    role: WorkspaceRole;
    status: string;
  };
  workspace: {
    id: string;
    company_name: string;
    contact_name: string | null;
    phone: string | null;
    website_url: string | null;
    email: string;
    status: string;
    business_number: string | null;
    billing_email: string | null;
    representative_name: string | null;
  };
};

function metadataText(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

export async function syncProfileAndLegacyMembership(user: User) {
  const email = user.email?.trim();
  if (!email) return null;

  const admin = createAdminClient();
  const name =
    metadataText(user, "full_name") ||
    metadataText(user, "name") ||
    metadataText(user, "contact_name") ||
    null;
  const avatarUrl =
    metadataText(user, "avatar_url") || metadataText(user, "picture") || null;

  const { error: profileError } = await admin.from("users").upsert(
    {
      id: user.id,
      name,
      email,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (profileError) throw profileError;

  const { data: existingMembership, error: membershipError } = await admin
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (existingMembership) return existingMembership.workspace_id as string;

  const { data: pendingInvite, error: inviteError } = await admin
    .from("member_invites")
    .select("id, workspace_id, role")
    .eq("email", email.toLowerCase())
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (inviteError) throw inviteError;
  if (pendingInvite) {
    const { error: acceptError } = await admin.from("workspace_members").upsert(
      {
        workspace_id: pendingInvite.workspace_id,
        user_id: user.id,
        role: pendingInvite.role,
        status: "active",
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,user_id" },
    );
    if (acceptError) throw acceptError;

    await admin
      .from("member_invites")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", pendingInvite.id);
    return pendingInvite.workspace_id as string;
  }

  const { data: legacyCustomer, error: legacyError } = await admin
    .from("workspaces")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (legacyError) throw legacyError;
  if (!legacyCustomer) return null;

  const { error: insertError } = await admin.from("workspace_members").upsert(
    {
      workspace_id: legacyCustomer.id,
      user_id: user.id,
      role: "owner",
      status: "active",
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id,user_id" },
  );
  if (insertError) throw insertError;
  return legacyCustomer.id as string;
}

export async function getCurrentWorkspaceAccess(): Promise<WorkspaceAccess | null> {
  const claims = await getSessionClaims();
  if (!claims) return null;

  const supabase = await createClient();
  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("id, workspace_id, role, status")
    .eq("user_id", claims.userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (membershipError || !membership) return null;

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select(
      "id, company_name, contact_name, phone, website_url, email, status, business_number, billing_email, representative_name",
    )
    .eq("id", membership.workspace_id)
    .maybeSingle();
  if (workspaceError || !workspace) return null;

  return {
    user: { id: claims.userId, email: claims.email },
    membership: membership as WorkspaceAccess["membership"],
    workspace: workspace as WorkspaceAccess["workspace"],
  };
}

export function canManageWorkspace(access: WorkspaceAccess) {
  return access.membership.role === "owner" || access.membership.role === "admin";
}
