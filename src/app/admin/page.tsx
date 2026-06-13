import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function dateTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString("ko-KR") : "-";
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email)) notFound();

  const admin = createAdminClient();
  const [diagnoses, customers, billingEvents, integrations] = await Promise.all([
    admin
      .from("diagnosis_responses")
      .select("id, company_name, contact_name, work_email, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("customers")
      .select("id, company_name, email, status, tenant_id, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("billing_events")
      .select("id, customer_id, event_type, status, message, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("channel_integrations")
      .select(
        "id, customer_id, tenant_id, provider, display_name, status, last_sync_at, last_error, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const queryError = [
    diagnoses.error,
    customers.error,
    billingEvents.error,
    integrations.error,
  ].find(Boolean);
  if (queryError) {
    throw new Error(`Failed to load admin overview: ${queryError.message}`);
  }

  const sections = [
    {
      title: "최근 진단 신청",
      rows: (diagnoses.data ?? []).map((row) => [
        row.company_name,
        row.contact_name,
        row.work_email,
        row.status,
        dateTime(row.created_at),
      ]),
      headers: ["회사", "담당자", "이메일", "상태", "신청 시각"],
    },
    {
      title: "최근 가입 고객",
      rows: (customers.data ?? []).map((row) => [
        row.company_name,
        row.email,
        row.status,
        row.tenant_id ? "연결됨" : "미연결",
        dateTime(row.created_at),
      ]),
      headers: ["회사", "이메일", "상태", "Tenant", "가입 시각"],
    },
    {
      title: "최근 결제 요청",
      rows: (billingEvents.data ?? []).map((row) => [
        row.event_type,
        row.status,
        row.message ?? "-",
        row.customer_id,
        dateTime(row.created_at),
      ]),
      headers: ["이벤트", "상태", "내용", "Customer ID", "요청 시각"],
    },
    {
      title: "최근 채널 연동",
      rows: (integrations.data ?? []).map((row) => [
        row.display_name,
        row.provider,
        row.status,
        row.tenant_id ? "동기화 대상" : "Tenant 미연결",
        row.last_error ?? dateTime(row.last_sync_at),
      ]),
      headers: ["이름", "Provider", "상태", "범위", "최근 동기화/오류"],
    },
  ];

  return (
    <main className="min-h-screen bg-[#F4F6FA] px-5 py-8 text-[#111C33] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4 rounded-3xl bg-[#111C33] p-7 text-white">
          <div>
            <p className="text-sm font-semibold text-white/60">Internal only</p>
            <h1 className="mt-2 text-3xl font-bold">운영 검수 현황</h1>
            <p className="mt-3 text-sm text-white/70">
              최근 신청, 가입, 결제 요청, 채널 연동을 읽기 전용으로 확인합니다.
            </p>
          </div>
          <Link
            href="/mypage"
            className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold"
          >
            마이페이지
          </Link>
        </header>

        {sections.map((section) => (
          <section
            key={section.title}
            className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
          >
            <h2 className="px-6 py-5 text-xl font-bold">{section.title}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    {section.headers.map((header) => (
                      <th key={header} className="whitespace-nowrap px-5 py-3">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {section.rows.length ? (
                    section.rows.map((row, rowIndex) => (
                      <tr key={`${section.title}-${rowIndex}`}>
                        {row.map((value, columnIndex) => (
                          <td
                            key={`${rowIndex}-${columnIndex}`}
                            className="max-w-sm px-5 py-4 align-top"
                          >
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={section.headers.length}
                        className="px-5 py-8 text-center text-slate-500"
                      >
                        확인할 항목이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
