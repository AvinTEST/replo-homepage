import { headers } from "next/headers";
import { SourceHome } from "../components/source-home/SourceHome";
import { shouldShowPortalLogin } from "../lib/deployment/host";
import { createClient } from "../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { login?: string; error?: string };
}) {
  const requestHeaders = headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <SourceHome
      authError={searchParams?.error === "auth_failed"}
      initialLoginOpen={searchParams?.login === "1"}
      initialAuthenticated={Boolean(user)}
      showPortalLogin={shouldShowPortalLogin(host)}
    />
  );
}
