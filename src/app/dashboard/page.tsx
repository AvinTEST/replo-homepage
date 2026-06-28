import { redirect } from "next/navigation";
import { OperationDashboard } from "@/components/dashboard/OperationDashboard";
import { calendarMonthRange } from "@/lib/dashboard/dates";
import { loadDashboard } from "@/lib/dashboard/service";
import { getCurrentCustomerAccess } from "@/lib/customers/access";
import { getSessionClaims } from "@/lib/supabase/claims";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");

  const access = await getCurrentCustomerAccess();
  if (!access) redirect("/onboarding");
  const range = calendarMonthRange("Asia/Seoul");
  const initialData = await loadDashboard({
    tenantId: access.tenantId,
    grain: "day",
    start: range.start,
    end: range.end,
  });

  return (
    <OperationDashboard
      tenantId={access.tenantId}
      initialData={initialData}
      canManage={access.membership.role === "owner" || access.membership.role === "admin"}
    />
  );
}
