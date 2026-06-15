import { redirect } from "next/navigation";
import { OperationDashboard } from "@/components/dashboard/OperationDashboard";
import { calendarMonthRange } from "@/lib/dashboard/dates";
import { loadDashboard } from "@/lib/dashboard/service";
import { getTenantAccess } from "@/lib/tenants/auth";

export const dynamic = "force-dynamic";

export default async function TenantDashboardPage({
  params,
}: {
  params: { tenantId: string };
}) {
  const access = await getTenantAccess(params.tenantId);
  if (!access) redirect(`/login?next=/dashboard/${params.tenantId}`);
  const range = calendarMonthRange("Asia/Seoul");
  const initialData = await loadDashboard({
    tenantId: params.tenantId,
    grain: "day",
    start: range.start,
    end: range.end,
  });

  return (
    <OperationDashboard
      tenantId={params.tenantId}
      initialData={initialData}
      canManage={access.role === "owner" || access.role === "admin"}
    />
  );
}
