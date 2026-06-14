"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { PortalRail, type PortalSection } from "./PortalRail";

export function PortalShell({
  tenantId,
  tenantName,
  planName,
  active,
  sidebar,
  children,
}: {
  tenantId: string;
  tenantName: string;
  planName: string;
  active: PortalSection;
  sidebar?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const signOut = async () => {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="ops-dashboard">
      <PortalRail tenantId={tenantId} active={active} workspaceName={tenantName} />
      <aside className={`dashboard-sidebar ${sidebar ? "" : "context-empty"}`}>
        <div className="sidebar-workspace">
          <span>WORKSPACE</span>
          <strong>{tenantName}</strong>
          <small>{planName} 플랜</small>
        </div>
        {sidebar}
        <button type="button" className="sidebar-logout" onClick={signOut}>
          로그아웃
        </button>
      </aside>
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
