import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type CustomerRecord = {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  website_url: string | null;
  email: string;
  status: string;
  created_at: string;
};

function metadataValue(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

export async function ensureCustomerForUser(
  supabase: SupabaseClient,
  user: User,
): Promise<CustomerRecord | null> {
  const email = user.email?.trim();
  if (!email) return null;

  const customer = {
    user_id: user.id,
    company_name: metadataValue(user, "company_name") || "회사명 미등록",
    contact_name: metadataValue(user, "contact_name") || null,
    phone: metadataValue(user, "phone") || null,
    website_url: metadataValue(user, "website_url") || null,
    email,
    status: "pending_plan",
  };

  const { error: upsertError } = await supabase
    .from("customers")
    .upsert(customer, {
      onConflict: "user_id",
      ignoreDuplicates: true,
    });

  if (upsertError) {
    console.error("Failed to initialize customer row:", upsertError.message);
    return null;
  }

  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, user_id, company_name, contact_name, phone, website_url, email, status, created_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to read initialized customer row:", error.message);
    return null;
  }

  return data as CustomerRecord | null;
}
