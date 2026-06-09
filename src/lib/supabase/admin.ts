import { createClient } from "@supabase/supabase-js";

export class SupabaseAdminConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseAdminConfigurationError";
  }
}

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new SupabaseAdminConfigurationError(
      "NEXT_PUBLIC_SUPABASE_URL is not configured",
    );
  }
  if (!serviceRoleKey) {
    throw new SupabaseAdminConfigurationError(
      "SUPABASE_SERVICE_ROLE_KEY is not configured",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
