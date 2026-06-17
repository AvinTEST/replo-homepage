import { PortalRouteLoading } from "@/components/portal/PortalRouteLoading";

export default function ReportsLoading() {
  return (
    <PortalRouteLoading
      title="운영 리포트를 불러오고 있습니다"
      subtitle="최근 12개월 운영 데이터를 집계하는 중입니다."
    />
  );
}
