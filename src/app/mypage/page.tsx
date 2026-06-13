import Link from "next/link";
import { redirect } from "next/navigation";
import { IntegrationManagement } from "@/components/mypage/IntegrationManagement";
import { MemberManagement } from "@/components/mypage/MemberManagement";
import { getCurrentCustomerAccess } from "@/lib/customers/access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const mypageMenus = [
  { href: "#account", label: "계정 정보" },
  { href: "#plan", label: "이용 플랜" },
  { href: "#billing", label: "결제 및 청구" },
  { href: "#members", label: "멤버 관리" },
  { href: "#integrations", label: "연동 채널 관리" },
  { href: "#guide", label: "응대 가이드" },
  { href: "#access", label: "권한 및 데이터 접근" },
];

const planPolicyItems = [
  ["채널 수", "준비 중"],
  ["콜 상담 포함 여부", "준비 중"],
  ["계약 기간", "준비 중"],
  ["해지 조건", "계약 확정 후 안내"],
  ["초과 문의 과금 기준", "플랜별 기준 준비 중"],
  ["운영 제외 범위", "계약 확정 후 안내"],
  ["플랜 변경 기준", "Replo 운영팀 협의 후 변경"],
];

const responseGuideItems = [
  ["FAQ", "자주 묻는 문의 문서를 준비 중입니다."],
  ["브랜드 톤앤매너", "브랜드 가이드 등록이 필요합니다."],
  ["배송 문의 응대 기준", "정책 확인 및 등록 준비 중"],
  ["교환/반품/환불 기준", "정책 확인 및 등록 준비 중"],
  ["클레임 처리 기준", "승인 단계 정의가 필요합니다."],
  ["보상 처리 기준", "보상 한도와 승인권자 등록이 필요합니다."],
  ["고객사 확인 필요 기준", "운영 시작 전 협의 예정"],
];

const accessItems = [
  ["고객사 어드민 접근 방식", "접근 방식 협의 및 등록 준비 중"],
  ["주문정보 접근 범위", "필요 최소 범위로 협의 예정"],
  ["개인정보 처리 기준", "계약 및 개인정보 처리방침에 따라 적용"],
  ["접근 가능 담당자", "담당자 등록 준비 중"],
  ["승인 필요 업무", "환불·보상·주문 변경 기준 협의 예정"],
  ["데이터 보관/삭제 기준", "계약 종료 및 법정 보관 기준에 따라 적용"],
];

function currency(value: number | string | null | undefined) {
  return `${Number(value ?? 0).toLocaleString("ko-KR")}원`;
}

function dateText(value: string | null | undefined) {
  return value || "준비 중";
}

function statusText(value: string | null | undefined) {
  if (!value) return "준비 중";
  if (value === "active") return "정상";
  if (value === "failed") return "실패";
  if (value === "requested") return "요청됨";
  if (value === "pending") return "처리 중";
  return value;
}

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const access = await getCurrentCustomerAccess();
  if (!access) redirect("/onboarding");
  const customer = access.customer;

  const [subscriptionResult, paymentMethodResult, billingEventsResult] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("id, plan_name, monthly_fee, included_tickets, next_billing_date, status")
        .eq("customer_id", customer.id)
        .maybeSingle(),
      supabase
        .from("payment_methods")
        .select("masked_number, status")
        .eq("customer_id", customer.id)
        .maybeSingle(),
      supabase
        .from("billing_events")
        .select("id, event_type, status, message, created_at")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const subscription = subscriptionResult.data;
  const paymentMethod = paymentMethodResult.data;
  const billingEvents = billingEventsResult.data ?? [];
  const accountStatus =
    customer.status === "active"
      ? "이용 중"
      : customer.status === "suspended"
        ? "이용 제한"
        : "플랜 선택 전";
  const failedEvents = billingEvents.filter((event) => event.status === "failed");

  return (
    <main className="min-h-screen bg-[#F4F6FA] px-5 py-8 text-[#111C33] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-3xl bg-[#5B47E0] p-7 text-white shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-white/70">Replo 마이페이지</p>
              <h1 className="mt-2 text-3xl font-bold">{customer.company_name}</h1>
              <p className="mt-3 text-sm text-white/80">
                계정, 이용 플랜, 결제, 응대 기준과 데이터 접근 정보를 확인합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                {accountStatus}
              </span>
              <Link
                href="/dashboard"
                className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#5B47E0]"
              >
                운영 대시보드
              </Link>
              {customer.tenant_id ? (
                <Link
                  href={`/dashboard/${customer.tenant_id}`}
                  className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold"
                >
                  실시간 상세 운영
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        <nav
          className="sticky top-0 z-10 mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur"
          aria-label="마이페이지 메뉴"
        >
          {mypageMenus.map((menu) => (
            <a
              key={menu.href}
              href={menu.href}
              className="whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-[#F2EFFF] hover:text-[#5B47E0]"
            >
              {menu.label}
            </a>
          ))}
        </nav>

        <section id="account" className="mt-5 scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B47E0]">Account</p>
          <h2 className="mt-2 text-2xl font-bold">계정 정보</h2>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["회사명", customer.company_name],
              ["대표 담당자", customer.representative_name || customer.contact_name || "미등록"],
              ["로그인 이메일", user.email || customer.email],
              ["사업자 정보", customer.business_number || "미등록"],
              ["세금계산서 이메일", customer.billing_email || "미등록"],
              ["내 권한", access.membership.role],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold text-slate-500">{label}</dt>
                <dd className="mt-2 break-words font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="plan" className="mt-5 scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B47E0]">Plan</p>
          <h2 className="mt-2 text-2xl font-bold">이용 플랜</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["현재 플랜", subscription?.plan_name ?? "플랜 선택 전"],
              ["월 이용료", subscription ? currency(subscription.monthly_fee) : "준비 중"],
              [
                "포함 문의량",
                subscription
                  ? `${Number(subscription.included_tickets ?? 0).toLocaleString("ko-KR")}건`
                  : "준비 중",
              ],
              ["다음 결제일", dateText(subscription?.next_billing_date)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[#F7F6FF] p-4">
                <p className="text-xs font-semibold text-[#6D5BE8]">{label}</p>
                <strong className="mt-2 block text-lg">{value}</strong>
              </div>
            ))}
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="bg-slate-50 px-5 py-4">
              <h3 className="font-bold">계약 및 운영 정책</h3>
              <p className="mt-1 text-sm text-slate-500">
                계약·정책 안내는 이용 플랜 정보와 함께 관리됩니다.
              </p>
            </div>
            <dl className="divide-y divide-slate-100">
              {planPolicyItems.map(([label, value]) => (
                <div key={label} className="grid gap-2 px-5 py-4 sm:grid-cols-[180px_1fr]">
                  <dt className="text-sm font-semibold text-slate-500">{label}</dt>
                  <dd className="text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          {!subscription ? (
            <Link
              href="/contact"
              className="mt-5 inline-flex rounded-xl bg-[#5B47E0] px-5 py-3 text-sm font-bold text-white"
            >
              플랜 상담 신청
            </Link>
          ) : null}
        </section>

        <section id="billing" className="mt-5 scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B47E0]">Billing</p>
          <h2 className="mt-2 text-2xl font-bold">결제 및 청구</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">등록된 결제수단</p>
              <strong className="mt-2 block text-lg">
                {paymentMethod?.masked_number ?? "등록된 결제수단 없음"}
              </strong>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">결제수단 상태</p>
              <strong className="mt-2 block text-lg">{statusText(paymentMethod?.status)}</strong>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">영수증/세금계산서</p>
              <strong className="mt-2 block text-lg">준비 중</strong>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/billing/payment-method"
              className="inline-flex rounded-xl bg-[#5B47E0] px-5 py-3 text-sm font-bold text-white"
            >
              결제수단 변경 요청하기
            </Link>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold">최근 청구 내역</h3>
              {billingEvents.length ? (
                <ul className="mt-4 divide-y divide-slate-100">
                  {billingEvents.map((event) => (
                    <li key={event.id} className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">
                          {event.message || event.event_type}
                        </span>
                        <span className="text-xs text-slate-500">{statusText(event.status)}</span>
                      </div>
                      <time className="mt-1 block text-xs text-slate-400">
                        {new Date(event.created_at).toLocaleDateString("ko-KR")}
                      </time>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-500">아직 청구 내역이 없습니다.</p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold">결제 실패 이력</h3>
              {failedEvents.length ? (
                <ul className="mt-4 space-y-3">
                  {failedEvents.map((event) => (
                    <li key={event.id} className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {event.message || "결제 처리에 실패했습니다."}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-500">확인된 결제 실패 이력이 없습니다.</p>
              )}
            </div>
          </div>
        </section>

        <MemberManagement />

        <IntegrationManagement />

        <section id="guide" className="mt-5 scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B47E0]">Response Guide</p>
          <h2 className="mt-2 text-2xl font-bold">응대 가이드</h2>
          <dl className="mt-6 grid gap-4 md:grid-cols-2">
            {responseGuideItems.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-100 p-4">
                <dt className="font-bold">{label}</dt>
                <dd className="mt-2 text-sm leading-6 text-slate-500">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="access" className="mt-5 scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B47E0]">Access</p>
          <h2 className="mt-2 text-2xl font-bold">권한 및 데이터 접근</h2>
          <dl className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {accessItems.map(([label, value]) => (
              <div key={label} className="grid gap-2 px-5 py-4 sm:grid-cols-[210px_1fr]">
                <dt className="text-sm font-semibold text-slate-600">{label}</dt>
                <dd className="text-sm leading-6 text-slate-500">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
