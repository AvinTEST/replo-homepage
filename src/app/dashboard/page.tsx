import { redirect } from "next/navigation";
import { getCurrentCustomerAccess } from "@/lib/customers/access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const access = await getCurrentCustomerAccess();
  if (!access) redirect("/onboarding");
  redirect(`/dashboard/${access.tenantId}`);
}
