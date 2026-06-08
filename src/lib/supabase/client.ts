import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in the browser.
 *
 * It reads the public URL and anon key from environment variables.
 * Throws if the variables are missing to help catch configuration errors
 * early in development.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase browser environment variables");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}