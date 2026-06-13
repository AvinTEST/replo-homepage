import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CustomerRole = "owner" | "admin" | "editor" | "viewer";

export type CustomerAccess = {
  user: User;
  membership: {
    id: string;
    customer_id: string;
    role: CustomerRole;
    status: string;
  };
  customer: {
    id: string;
    tenant_id: string | null;
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

export function tenantRoleForCustomerRole(
  role: CustomerRole,
): "owner" | "admin" | "manager" | "viewer" {
  if (role === "owner" || role === "admin") return role;
  if (role === "editor") return "manager";
  return "viewer";
}

async function syncTenantMembership(
  admin: ReturnType<typeof createAdminClient>,
  customerId: string,
  userId: string,
  role: CustomerRole,
) {
  const { data: customer, error: customerError } = await admin
    .from("customers")
    .select("tenant_id")
    .eq("id", customerId)
    .maybeSingle();
  if (customerError) throw customerError;
  if (!customer?.tenant_id) return;

  const { error } = await admin.from("tenant_users").upsert(
    {
      tenant_id: customer.tenant_id,
      user_id: userId,
      role: tenantRoleForCustomerRole(role),
    },
    { onConflict: "tenant_id,user_id" },
  );
  if (error) throw error;
}

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

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      user_id: user.id,
      name,
      email,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (profileError) throw profileError;

  const { data: existingMembership, error: membershipError } = await admin
    .from("customer_members")
    .select("customer_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (existingMembership) {
    await syncTenantMembership(
      admin,
      existingMembership.customer_id as string,
      user.id,
      existingMembership.role as CustomerRole,
    );
    return existingMembership.customer_id as string;
  }

  const { data: pendingInvite, error: inviteError } = await admin
    .from("member_invites")
    .select("id, customer_id, role")
    .eq("email", email.toLowerCase())
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (inviteError) throw inviteError;
  if (pendingInvite) {
    const { error: acceptError } = await admin.from("customer_members").upsert(
      {
        customer_id: pendingInvite.customer_id,
        user_id: user.id,
        role: pendingInvite.role,
        status: "active",
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "customer_id,user_id" },
    );
    if (acceptError) throw acceptError;
    await syncTenantMembership(
      admin,
      pendingInvite.customer_id as string,
      user.id,
      pendingInvite.role as CustomerRole,
    );

    await admin
      .from("member_invites")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", pendingInvite.id);
    return pendingInvite.customer_id as string;
  }

  const { data: legacyCustomer, error: legacyError } = await admin
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (legacyError) throw legacyError;
  if (!legacyCustomer) return null;

  const { error: insertError } = await admin.from("customer_members").upsert(
    {
      customer_id: legacyCustomer.id,
      user_id: user.id,
      role: "owner",
      status: "active",
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "customer_id,user_id" },
  );
  if (insertError) throw insertError;
  await syncTenantMembership(admin, legacyCustomer.id as string, user.id, "owner");
  return legacyCustomer.id as string;
}

export async function getCurrentCustomerAccess(): Promise<CustomerAccess | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: membership, error: membershipError } = await admin
    .from("customer_members")
    .select("id, customer_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (membershipError || !membership) return null;

  const { data: customer, error: customerError } = await admin
    .from("customers")
    .select(
      "id, tenant_id, company_name, contact_name, phone, website_url, email, status, business_number, billing_email, representative_name",
    )
    .eq("id", membership.customer_id)
    .maybeSingle();
  if (customerError || !customer) return null;

  await admin
    .from("customer_members")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", membership.id);

  return {
    user,
    membership: membership as CustomerAccess["membership"],
    customer: customer as CustomerAccess["customer"],
  };
}

export function canManageCustomer(access: CustomerAccess) {
  return access.membership.role === "owner" || access.membership.role === "admin";
}
