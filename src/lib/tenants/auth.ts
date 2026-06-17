import "server-only";
import { getSessionClaims } from "@/lib/supabase/claims";
import { createClient } from "@/lib/supabase/server";

export type TenantAccess = {
  userId: string;
  tenantId: string;
  role: "owner" | "admin" | "manager" | "viewer";
};

export async function getTenantAccess(tenantId: string): Promise<TenantAccess | null> {
  const claims = await getSessionClaims();
  if (!claims) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("tenant_users")
    .select("tenant_id, role")
    .eq("tenant_id", tenantId)
    .eq("user_id", claims.userId)
    .maybeSingle();

  if (!data) return null;
  return {
    userId: claims.userId,
    tenantId: data.tenant_id as string,
    role: data.role as TenantAccess["role"],
  };
}

export function canManageIntegrations(access: TenantAccess) {
  return access.role === "owner" || access.role === "admin";
}
