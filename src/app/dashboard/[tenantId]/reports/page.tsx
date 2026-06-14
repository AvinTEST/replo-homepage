import { notFound, redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { defaultRange } from "@/lib/dashboard/dates";
import { loadDashboard } from "@/lib/dashboard/service";
import { createClient } from "@/lib/supabase/server";
import { getTenantAccess } from "@/lib/tenants/auth";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ params }: { params: { tenantId: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/${params.tenantId}/reports`);
  if (!(await getTenantAccess(params.tenantId))) notFound();
  const range = defaultRange("month");
  const data = await loadDashboard({
    tenantId: params.tenantId,
    grain: "month",
    start: range.start,
    end: range.end,
  });

  return (
    <PortalShell
      tenantId={params.tenantId}
      tenantName={data.tenant.name}
      planName={data.tenant.planName}
      active="reports"
    >
      <header className="dashboard-page-header">
        <div>
          <p>REPORTS</p>
          <h1>운영 리포트</h1>
          <span>최근 12개월 운영 데이터 요약입니다.</span>
        </div>
        <div className="dashboard-badges">
          <span>{data.range.start} ~ {data.range.end}</span>
          <span>월간 집계</span>
        </div>
      </header>
      <section>
        <div className="dashboard-section-head">
          <h2>운영 요약</h2>
          <span />
          <p>선택 기간 기준</p>
        </div>
        <div className="report-summary-grid">
          <article className="metric-card kpi"><p className="metric-label">총 처리 건수</p><strong>{data.operationKpis.total.toLocaleString("ko-KR")}</strong><small>전체 채널 합계</small></article>
          <article className="metric-card kpi"><p className="metric-label">평균 전화 응대율</p><strong>{data.callKpis.answerRate.toFixed(1)}%</strong><small>채널톡 전화 기준</small></article>
          <article className="metric-card kpi"><p className="metric-label">최다 처리 채널</p><strong>{data.operationKpis.topChannel?.name ?? "-"}</strong><small>{(data.operationKpis.topChannel?.count ?? 0).toLocaleString("ko-KR")}건</small></article>
          <article className="metric-card kpi"><p className="metric-label">최다 세부업무</p><strong>{data.operationKpis.topTask?.name ?? "-"}</strong><small>{(data.operationKpis.topTask?.count ?? 0).toLocaleString("ko-KR")}건</small></article>
        </div>
      </section>
      <section className="panel table-panel">
        <div className="panel-toolbar"><div><strong>월간 운영 상세</strong><small>월별 처리 건수와 채널 운영 데이터를 확인합니다.</small></div></div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>기준일</th><th>판매채널</th><th>세부업무</th><th>처리 건수</th><th>메모</th></tr></thead>
            <tbody>
              {data.table.map((row, index) => (
                <tr key={`${row.date}-${row.channel}-${row.task}-${index}`}>
                  <td>{row.date}</td>
                  <td><span className="channel-tag">{row.channel}</span></td>
                  <td>{row.task}</td>
                  <td>{row.count.toLocaleString("ko-KR")}</td>
                  <td>{row.memo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PortalShell>
  );
}
