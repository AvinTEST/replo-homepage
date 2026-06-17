import { redirect } from "next/navigation";
import { getCurrentCustomerAccess } from "@/lib/customers/access";
import { getSessionClaims } from "@/lib/supabase/claims";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");

  const access = await getCurrentCustomerAccess();
  if (!access) redirect("/onboarding");
  redirect(`/dashboard/${access.tenantId}`);
}
