import "server-only";
import { getSessionClaims } from "@/lib/supabase/claims";
import { createClient } from "@/lib/supabase/server";

export type TenantAccess = {
  userId: string;
  tenantId: string;
  role: "owner" | "admin" | "editor" | "viewer";
};

export async function getTenantAccess(workspaceId: string): Promise<TenantAccess | null> {
  const claims = await getSessionClaims();
  if (!claims) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", claims.userId)
    .eq("status", "active")
    .maybeSingle();

  if (!data) return null;
  return {
    userId: claims.userId,
    tenantId: data.workspace_id as string,
    role: data.role as TenantAccess["role"],
  };
}

export function canManageIntegrations(access: TenantAccess) {
  return access.role === "owner" || access.role === "admin";
}
