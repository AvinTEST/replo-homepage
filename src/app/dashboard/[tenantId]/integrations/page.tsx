import { redirect } from "next/navigation";

export default function IntegrationsPage({ params }: { params: { tenantId: string } }) {
  redirect(`/dashboard/${params.tenantId}`);
}
