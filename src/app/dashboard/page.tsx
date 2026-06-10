import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureCustomerForUser } from "@/lib/customers/initialize";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const customer = await ensureCustomerForUser(supabase, user);
  if (!customer) {
    return (
      <main className="min-h-screen bg-[#F7F6FF] px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold text-gray-900">계정 초기 설정이 필요합니다.</h1>
          <p className="mt-3 text-gray-600">
            다시 로그인해 보시고, 문제가 계속되면 Replo 고객센터에 문의해 주세요.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-xl bg-[#5B47E0] px-5 py-3 font-semibold text-white"
          >
            다시 로그인하기
          </Link>
        </div>
      </main>
    );
  }

  const [subscriptionResult, paymentMethodResult, membershipResult] = await Promise.all([
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
      .from("tenant_users")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  const subscription = subscriptionResult.data;
  const paymentMethod = paymentMethodResult.data;
  const membership = membershipResult.data;
  const accountStatus =
    customer.status === "active"
      ? "이용 중"
      : customer.status === "suspended"
        ? "이용 제한"
        : "플랜 선택 전";

  return (
    <main className="min-h-screen bg-[#F7F6FF] px-6 py-12 text-gray-950">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl bg-[#5B47E0] p-8 text-white shadow-sm">
          <p className="text-sm font-semibold text-white/70">Replo 고객 대시보드</p>
          <h1 className="mt-3 text-3xl font-bold">{customer.company_name}</h1>
          <p className="mt-3 text-sm text-white/80">
            {customer.contact_name || user.email} · {customer.email}
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">계정 상태</p>
            <h2 className="mt-3 text-2xl font-bold">{accountStatus}</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              이메일 인증과 고객 정보 연결이 완료되었습니다.
            </p>
          </article>
          <article className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">플랜 상태</p>
            <h2 className="mt-3 text-2xl font-bold">
              {subscription?.plan_name ?? "아직 선택한 플랜이 없습니다"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {subscription
                ? `구독 상태: ${subscription.status ?? "이용 중"}`
                : "상담 후 이용 목적에 맞는 플랜을 선택할 수 있습니다."}
            </p>
          </article>
          <article className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">결제수단 상태</p>
            <h2 className="mt-3 text-2xl font-bold">
              {paymentMethod?.masked_number ?? "등록된 결제수단 없음"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {paymentMethod?.status ? `상태: ${paymentMethod.status}` : "플랜 확정 후 등록할 수 있습니다."}
            </p>
          </article>
        </section>

        {subscription ? (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">현재 이용 정보</h2>
            <div className="mt-5 grid gap-4 text-sm text-gray-600 sm:grid-cols-3">
              <p>월 이용료<br /><strong className="text-lg text-gray-950">{Number(subscription.monthly_fee ?? 0).toLocaleString("ko-KR")}원</strong></p>
              <p>포함 문의량<br /><strong className="text-lg text-gray-950">{Number(subscription.included_tickets ?? 0).toLocaleString("ko-KR")}건</strong></p>
              <p>다음 결제일<br /><strong className="text-lg text-gray-950">{subscription.next_billing_date ?? "-"}</strong></p>
            </div>
          </section>
        ) : null}

        <section className="mt-6 flex flex-col gap-3 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {membership ? "운영 현황을 확인하세요" : "Replo 이용을 시작해 보세요"}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {membership
                ? "연결된 채널의 처리량과 운영 지표를 상세 대시보드에서 확인할 수 있습니다."
                : "운영 진단을 신청하면 현재 상황에 맞는 플랜을 안내해 드립니다."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {membership ? (
              <Link
                href={`/dashboard/${membership.tenant_id}`}
                className="inline-flex rounded-xl bg-[#5B47E0] px-5 py-3 font-semibold text-white"
              >
                운영 대시보드 보기
              </Link>
            ) : (
              <Link
                href="/diagnosis"
                className="inline-flex rounded-xl bg-[#5B47E0] px-5 py-3 font-semibold text-white"
              >
                플랜 상담 신청
              </Link>
            )}
            {subscription ? (
              <Link
                href="/billing/payment-method"
                className="inline-flex rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-700"
              >
                결제수단 관리
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
