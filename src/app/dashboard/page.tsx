import Link from "next/link";
import { redirect } from "next/navigation";
import {
  channelVolumes,
  improvementSuggestions,
  inquiryTypes,
  operationsSummary,
  statusBreakdown,
  urgentIssues,
  vocHighlights,
} from "@/data/operations-dashboard";
import { getCurrentCustomerAccess } from "@/lib/customers/access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const access = await getCurrentCustomerAccess();
  if (!access) redirect("/onboarding");
  const customer = access.customer;

  const { data: membership } = await supabase
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const summaryCards = [
    { label: "총 문의 수", value: `${formatNumber(operationsSummary.totalTickets)}건` },
    { label: "처리 완료", value: `${formatNumber(operationsSummary.completedTickets)}건` },
    { label: "미처리", value: `${formatNumber(operationsSummary.pendingTickets)}건` },
    { label: "평균 응답 시간", value: operationsSummary.averageResponseTime },
    { label: "응답률", value: `${operationsSummary.responseRate}%` },
  ];

  return (
    <main className="min-h-screen bg-[#F4F6FA] px-5 py-8 text-[#111C33] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 rounded-3xl bg-[#5B47E0] p-7 text-white shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-white/70">CS 운영 대시보드</p>
            <h1 className="mt-2 text-3xl font-bold">{customer.company_name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
              {operationsSummary.period} 고객 문의 흐름과 주요 운영 이슈를 한눈에 확인하세요.
              현재 화면의 운영 지표는 예시 데이터입니다.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="고객 포털 이동">
            <Link
              href="/mypage"
              className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold text-white"
            >
              마이페이지
            </Link>
            {membership ? (
              <Link
                href={`/dashboard/${membership.tenant_id}`}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#5B47E0]"
              >
                실시간 상세 운영 보기
              </Link>
            ) : null}
          </nav>
        </header>

        <section className="mt-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B47E0]">
                Monthly Overview
              </p>
              <h2 className="mt-2 text-2xl font-bold">월간 문의 처리 현황</h2>
            </div>
            <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm">
              {operationsSummary.period}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {summaryCards.map((card) => (
              <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <strong className="mt-3 block text-2xl font-bold tracking-tight">{card.value}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">채널별 문의량</h2>
            <p className="mt-1 text-sm text-slate-500">전체 문의 중 채널별 유입 비중입니다.</p>
            <div className="mt-6 space-y-5">
              {channelVolumes.map((channel) => (
                <div key={channel.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{channel.name}</span>
                    <span className="text-slate-500">{formatNumber(channel.value)}건</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#5B47E0]"
                      style={{ width: `${channel.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">문의 유형 TOP 5</h2>
            <p className="mt-1 text-sm text-slate-500">반복 문의 개선 우선순위를 확인하세요.</p>
            <ol className="mt-5 divide-y divide-slate-100">
              {inquiryTypes.map((item, index) => (
                <li key={item.name} className="flex items-center gap-4 py-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F2EFFF] text-sm font-bold text-[#5B47E0]">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.change}</p>
                  </div>
                  <strong className="text-sm">{formatNumber(item.value)}건</strong>
                </li>
              ))}
            </ol>
          </article>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">처리 상태별 현황</h2>
            <div className="mt-5 space-y-3">
              {statusBreakdown.map((status) => (
                <div key={status.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="flex items-center gap-3 text-sm font-semibold">
                    <i className={`h-2.5 w-2.5 rounded-full ${status.tone}`} />
                    {status.name}
                  </span>
                  <strong>{formatNumber(status.value)}건</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">최근 VOC 요약</h2>
            <p className="mt-1 text-sm text-slate-500">최근 문의에서 반복적으로 확인된 고객 의견입니다.</p>
            <ul className="mt-5 space-y-3">
              {vocHighlights.map((item) => (
                <li key={item} className="rounded-2xl border border-slate-100 px-4 py-4 text-sm leading-6 text-slate-700">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">반복 문의 개선 제안</h2>
            <div className="mt-5 space-y-3">
              {improvementSuggestions.map((suggestion) => (
                <div key={suggestion.title} className="rounded-2xl bg-[#F7F6FF] p-4">
                  <h3 className="font-bold text-[#4935C8]">{suggestion.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{suggestion.description}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">긴급 이슈</h2>
            <div className="mt-5 space-y-3">
              {urgentIssues.map((issue) => (
                <div key={issue.title} className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold">{issue.title}</h3>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-rose-600">
                      {issue.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{issue.description}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6 flex flex-col gap-4 rounded-3xl bg-[#111C33] p-7 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">운영 리포트에서 상세 흐름을 확인하세요.</h2>
            <p className="mt-2 text-sm text-white/65">
              운영 데이터 연결 전에는 예시 지표가 표시됩니다.
            </p>
          </div>
          <Link
            href={membership ? `/dashboard/${membership.tenant_id}/reports` : "/contact"}
            className="inline-flex justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#111C33]"
          >
            운영 리포트 보기
          </Link>
        </section>
      </div>
    </main>
  );
}
