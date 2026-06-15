import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { connectorDefinitions } from "@/lib/connectors/placeholders";
import { loadPortalTenant } from "@/lib/dashboard/service";
import { listIntegrations } from "@/lib/integrations/service";
import { getTenantAccess } from "@/lib/tenants/auth";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage({
  params,
}: {
  params: { tenantId: string };
}) {
  if (!(await getTenantAccess(params.tenantId))) {
    redirect(`/login?next=/dashboard/${params.tenantId}/integrations`);
  }

  const [integrations, tenant] = await Promise.all([
    listIntegrations(params.tenantId),
    loadPortalTenant(params.tenantId),
  ]);
  const statusByProvider = new Map(integrations.map((item) => [item.provider, item]));

  return (
    <PortalShell
      tenantId={params.tenantId}
      tenantName={tenant.name}
      planName={tenant.planName}
      active="integrations"
    >
      <header className="dashboard-page-header">
        <div>
          <p>INTEGRATIONS</p>
          <h1>채널 연동 관리</h1>
          <span>고객사 운영 데이터를 수집할 채널을 관리합니다.</span>
        </div>
        <div className="dashboard-badges"><span>{integrations.length}개 연결 정보</span></div>
      </header>
      <div className="integration-grid">
        {connectorDefinitions.map((definition) => {
          const current = statusByProvider.get(definition.provider);
          const available = definition.availability === "available";
          return (
            <article className="integration-card" key={definition.provider}>
              <span className={`status ${current?.status ?? ""}`}>
                {current?.status === "connected" ? "연결됨" : available ? "연결 필요" : "준비 중"}
              </span>
              <h2>{definition.displayName}</h2>
              <p>
                {available
                  ? "Open API credential을 서버에 암호화 저장하고 운영 데이터를 동기화합니다."
                  : "공식 API 범위와 권한을 검증한 뒤 순차 지원합니다."}
              </p>
              {available ? (
                <Link className="primary-button" href={`/dashboard/${params.tenantId}/integrations/channel-talk`}>
                  {current?.configured ? "연동 설정 수정" : "연동 설정"}
                </Link>
              ) : (
                <span className="secondary-button">추후 지원</span>
              )}
            </article>
          );
        })}
      </div>
    </PortalShell>
  );
}
