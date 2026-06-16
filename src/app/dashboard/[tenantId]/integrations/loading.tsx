import { PortalRouteLoading } from "@/components/portal/PortalRouteLoading";

export default function IntegrationsLoading() {
  return (
    <PortalRouteLoading
      title="채널 연동 정보를 불러오고 있습니다"
      subtitle="연결된 채널 상태를 확인하는 중입니다."
    />
  );
}
