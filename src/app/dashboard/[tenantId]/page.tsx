import { notFound, redirect } from "next/navigation";
import { OperationDashboard } from "@/components/dashboard/OperationDashboard";
import { defaultRange } from "@/lib/dashboard/dates";
import { loadDashboard } from "@/lib/dashboard/service";
import { createClient } from "@/lib/supabase/server";
import { getTenantAccess } from "@/lib/tenants/auth";

export const dynamic = "force-dynamic";

export default async function TenantDashboardPage({
  params,
}: {
  params: { tenantId: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/${params.tenantId}`);

  const access = await getTenantAccess(params.tenantId);
  if (!access) notFound();
  const range = defaultRange("week");
  const initialData = await loadDashboard({
    tenantId: params.tenantId,
    grain: "week",
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
