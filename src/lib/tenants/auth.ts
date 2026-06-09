import "server-only";
import { createClient } from "@/lib/supabase/server";

export type TenantAccess = {
  userId: string;
  tenantId: string;
  role: "owner" | "admin" | "manager" | "viewer";
  demo: boolean;
};

export async function getTenantAccess(tenantId: string): Promise<TenantAccess | null> {
  if (tenantId === "demo" && process.env.NODE_ENV !== "production") {
    return { userId: "development-preview", tenantId, role: "viewer", demo: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  if (tenantId === "demo") {
    return { userId: user.id, tenantId, role: "viewer", demo: true };
  }

  const { data } = await supabase
    .from("tenant_users")
    .select("tenant_id, role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;
  return {
    userId: user.id,
    tenantId: data.tenant_id as string,
    role: data.role as TenantAccess["role"],
    demo: false,
  };
}

export function canManageIntegrations(access: TenantAccess) {
  return access.role === "owner" || access.role === "admin";
}
