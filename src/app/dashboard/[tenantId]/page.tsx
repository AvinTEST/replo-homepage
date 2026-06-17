import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { getTenantAccess } from "@/lib/tenants/auth";

export const dynamic = "force-dynamic";

const sampleMetrics = [
  { label: "오늘 접수된 문의", value: "28건", helper: "예시 데이터" },
  { label: "처리 완료 문의", value: "21건", helper: "예시 데이터" },
  { label: "평균 응답 시간", value: "12분", helper: "예시 데이터" },
  { label: "미처리 문의", value: "7건", helper: "예시 데이터" },
];

const sampleTypes = [
  { label: "배송 문의", count: 9 },
  { label: "교환/반품", count: 7 },
  { label: "상품 문의", count: 6 },
  { label: "기타 문의", count: 6 },
];

export default async function TenantDashboardPage({
  params,
}: {
  params: { tenantId: string };
}) {
  const access = await getTenantAccess(params.tenantId);
  if (!access) redirect(`/login?next=/dashboard/${params.tenantId}`);

  return (
    <PortalShell
      tenantId={params.tenantId}
      tenantName="Replo Workspace"
      planName="Free"
      active="dashboard"
    >
      <header className="dashboard-page-header">
        <div>
          <p>LAUNCH PREVIEW</p>
          <h1>운영 대시보드</h1>
          <span>현재 런칭 준비 중입니다. 일부 데이터는 예시로 표시됩니다.</span>
        </div>
        <div className="dashboard-badges">
          <span>Free 플랜</span>
          <span>샘플 데이터</span>
        </div>
      </header>

      <section className="report-summary-grid">
        {sampleMetrics.map((metric) => (
          <article className="metric-card kpi" key={metric.label}>
            <p className="metric-label">{metric.label}</p>
            <strong>{metric.value}</strong>
            <small>{metric.helper}</small>
          </article>
        ))}
      </section>

      <section className="panel table-panel">
        <div className="panel-toolbar">
          <div>
            <strong>문의 유형</strong>
            <small>정식 오픈 이후 실제 운영 데이터로 제공됩니다.</small>
          </div>
        </div>
        <div className="bar-chart">
          {sampleTypes.map((item) => (
            <div className="bar-row" key={item.label}>
              <span className="bar-name">{item.label}</span>
              <span className="bar-track">
                <span style={{ width: `${(item.count / 9) * 100}%` }} />
              </span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-toolbar">
          <div>
            <strong>연동 상태</strong>
            <small>정식 오픈 이후 제공</small>
          </div>
        </div>
        <p className="empty-note">실제 운영 연동은 준비 중입니다.</p>
      </section>
    </PortalShell>
  );
}
