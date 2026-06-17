import { redirect } from "next/navigation";

export default function ChannelTalkIntegrationPage({
  params,
}: {
  params: { tenantId: string };
}) {
  redirect(`/dashboard/${params.tenantId}`);
}
