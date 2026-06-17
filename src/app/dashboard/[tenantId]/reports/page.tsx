import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { getTenantAccess } from "@/lib/tenants/auth";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ params }: { params: { tenantId: string } }) {
  if (!(await getTenantAccess(params.tenantId))) {
    redirect(`/login?next=/dashboard/${params.tenantId}/reports`);
  }

  return (
    <PortalShell
      tenantId={params.tenantId}
      tenantName="Replo Workspace"
      planName="Free"
      active="reports"
    >
      <header className="dashboard-page-header">
        <div>
          <p>REPORTS</p>
          <h1>운영 리포트</h1>
          <span>현재 런칭 준비 중입니다. 일부 데이터는 예시로 표시됩니다.</span>
        </div>
        <div className="dashboard-badges">
          <span>샘플 데이터</span>
        </div>
      </header>
      <section className="panel">
        <div className="panel-toolbar">
          <div>
            <strong>리포트 준비 중</strong>
            <small>정식 오픈 이후 실제 운영 리포트를 제공합니다.</small>
          </div>
        </div>
        <p className="empty-note">현재 화면은 런칭 준비 상태입니다.</p>
      </section>
    </PortalShell>
  );
}
