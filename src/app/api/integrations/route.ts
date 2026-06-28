import { NextResponse } from "next/server";
import { getCurrentWorkspaceAccess } from "@/lib/workspaces/access";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const access = await getCurrentWorkspaceAccess();
  if (!access) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: integrations, error }, { data: brands }] = await Promise.all([
    admin
      .from("channel_integrations")
      .select(
        "id, brand_id, provider, channel_name, display_name, access_key_masked, status, last_checked_at, last_synced_at, created_at",
      )
      .eq("workspace_id", access.workspace.id)
      .order("created_at", { ascending: false }),
    admin
      .from("brands")
      .select("id, name, website_url, status")
      .eq("workspace_id", access.workspace.id)
      .order("created_at", { ascending: true }),
  ]);
  if (error) {
    return NextResponse.json({ error: "연동 채널을 불러오지 못했습니다." }, { status: 500 });
  }

  const brandMap = new Map((brands ?? []).map((brand) => [brand.id, brand.name]));
  return NextResponse.json({
    role: access.membership.role,
    brands: brands ?? [],
    integrations: (integrations ?? []).map((integration) => ({
      ...integration,
      brand_name: brandMap.get(integration.brand_id) ?? "브랜드 미지정",
    })),
    limit: 10,
    activeCount: (integrations ?? []).filter(
      (integration) =>
        integration.provider === "channel_talk" && integration.status === "connected",
    ).length,
  });
}
