"use client";

import Link from "next/link";
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

  const links: Array<{ id: PortalSection; href: string; label: string }> = [
    { id: "dashboard", href: `/dashboard/${tenantId}`, label: "운영 대시보드" },
    { id: "reports", href: `/dashboard/${tenantId}/reports`, label: "운영 리포트" },
    { id: "integrations", href: `/dashboard/${tenantId}/integrations`, label: "연동 채널 관리" },
    { id: "account", href: "/mypage", label: "워크스페이스 설정" },
  ];

  return (
    <div className="ops-dashboard">
      <PortalRail tenantId={tenantId} active={active} workspaceName={tenantName} />
      <aside className="dashboard-sidebar">
        <div className="sidebar-workspace">
          <span>WORKSPACE</span>
          <strong>{tenantName}</strong>
          <small>{planName} 플랜</small>
        </div>
        <div className="sidebar-navigation">
          <p>운영</p>
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={active === link.id ? "active" : undefined}
              aria-current={active === link.id ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
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
