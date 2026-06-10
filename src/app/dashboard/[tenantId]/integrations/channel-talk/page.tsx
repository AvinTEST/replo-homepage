import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChannelTalkCredentialForm } from "@/components/dashboard/ChannelTalkCredentialForm";
import { listIntegrations } from "@/lib/integrations/service";
import { createClient } from "@/lib/supabase/server";
import { canManageIntegrations, getTenantAccess } from "@/lib/tenants/auth";

export const dynamic = "force-dynamic";

export default async function ChannelTalkIntegrationPage({
  params,
}: {
  params: { tenantId: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/${params.tenantId}/integrations/channel-talk`);
  const access = await getTenantAccess(params.tenantId);
  if (!access) notFound();

  const integration = (await listIntegrations(params.tenantId)).find(
    (item) => item.provider === "channel_talk",
  );

  return (
    <main className="integration-page">
      <div className="integration-container">
        <header className="integration-header">
          <div>
            <h1>채널톡 Open API 연동</h1>
            <p>Access Secret은 저장 후 다시 표시되지 않으며 서버에서만 복호화됩니다.</p>
          </div>
          <Link className="secondary-button" href={`/dashboard/${params.tenantId}/integrations`}>연동 목록</Link>
        </header>
        {canManageIntegrations(access) ? (
          <ChannelTalkCredentialForm
            tenantId={params.tenantId}
            configured={integration?.configured ?? false}
          />
        ) : (
          <div className="credential-form">
            <strong>읽기 전용 계정입니다.</strong>
            <p>Owner 또는 Admin 권한이 있어야 연동 정보를 수정할 수 있습니다.</p>
          </div>
        )}
      </div>
    </main>
  );
}
