import { PortalRouteLoading } from "@/components/portal/PortalRouteLoading";

export default function DashboardLoading() {
  return (
    <PortalRouteLoading
      title="운영 데이터를 불러오고 있습니다"
      subtitle="연동된 채널과 리포트 정보를 확인하는 중입니다."
    />
  );
}
