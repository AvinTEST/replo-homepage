import "server-only";
import { createClient } from "@/lib/supabase/server";

export type TenantAccess = {
  userId: string;
  tenantId: string;
  role: "owner" | "admin" | "manager" | "viewer";
};

export async function getTenantAuthorization(tenantId: string): Promise<{
  authenticated: boolean;
  access: TenantAccess | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { authenticated: false, access: null };

  const { data } = await supabase
    .from("tenant_users")
    .select("tenant_id, role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return { authenticated: true, access: null };
  return {
    authenticated: true,
    access: {
      userId: user.id,
      tenantId: data.tenant_id as string,
      role: data.role as TenantAccess["role"],
    },
  };
}

export async function getTenantAccess(tenantId: string): Promise<TenantAccess | null> {
  return (await getTenantAuthorization(tenantId)).access;
}

export function canManageIntegrations(access: TenantAccess) {
  return access.role === "owner" || access.role === "admin";
}
