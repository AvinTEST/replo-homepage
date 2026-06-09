import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
    <main className="integration-page">
      <div className="integration-container">
        <header className="integration-header">
          <div><h1>운영 리포트</h1><p>최근 12개월 운영 데이터 요약입니다.</p></div>
          <Link className="secondary-button" href={`/dashboard/${params.tenantId}`}>대시보드로 돌아가기</Link>
        </header>
        <div className="integration-grid">
          <article className="integration-card"><h2>총 처리 건수</h2><p>{data.operationKpis.total.toLocaleString("ko-KR")}건</p></article>
          <article className="integration-card"><h2>평균 전화 응대율</h2><p>{data.callKpis.answerRate.toFixed(1)}%</p></article>
          <article className="integration-card"><h2>최다 처리 채널</h2><p>{data.operationKpis.topChannel?.name ?? "-"}</p></article>
          <article className="integration-card"><h2>최다 세부업무</h2><p>{data.operationKpis.topTask?.name ?? "-"}</p></article>
        </div>
      </div>
    </main>
  );
}
