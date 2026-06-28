import { redirect } from "next/navigation";
import { OperationDashboard } from "@/components/dashboard/OperationDashboard";
import { calendarMonthRange } from "@/lib/dashboard/dates";
import { loadDashboard } from "@/lib/dashboard/service";
import { getCurrentWorkspaceAccess } from "@/lib/workspaces/access";
import { getSessionClaims } from "@/lib/supabase/claims";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");

  const access = await getCurrentWorkspaceAccess();
  if (!access) redirect("/onboarding");
  const range = calendarMonthRange("Asia/Seoul");
  const initialData = await loadDashboard({
    workspaceId: access.workspace.id,
    grain: "day",
    start: range.start,
    end: range.end,
  });

  return (
    <OperationDashboard
      tenantId={access.workspace.id}
      initialData={initialData}
      canManage={access.membership.role === "owner" || access.membership.role === "admin"}
    />
  );
}
