import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user is logged in redirect to login page
  if (!user) {
    redirect("/login");
  }

  // Fetch the customer record linked to this user
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // If the customer is missing show an error
  if (!customer) {
    return (
      <main className="min-h-screen bg-[#F7F6FF] px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold">고객 정보가 없습니다.</h1>
          <p className="mt-3 text-gray-600">
            관리자에게 고객 계정 등록을 요청해 주세요.
          </p>
        </div>
      </main>
    );
  }

  // Fetch subscription and payment method details
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("customer_id", customer.id)
    .single();
  const { data: paymentMethod } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("customer_id", customer.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-[#F7F6FF] px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-[#5B47E0] p-8 text-white">
          <p className="text-sm text-white/70">Replo Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold">
            {customer.company_name} 이용 현황
          </h1>
        </div>
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">이용 플랜</p>
            <h2 className="mt-2 text-2xl font-bold">
              {subscription?.plan_name ?? "등록 전"}
            </h2>
            <p className="mt-4 text-gray-600">
              월 이용료: {subscription ? `${subscription.monthly_fee.toLocaleString()}원` : "-"}
            </p>
            <p className="mt-1 text-gray-600">
              포함 문의량: {subscription ? `${subscription.included_tickets.toLocaleString()}건` : "-"}
            </p>
            <p className="mt-1 text-gray-600">
              다음 결제일: {subscription?.next_billing_date ?? "-"}
            </p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">결제수단</p>
            <h2 className="mt-2 text-2xl font-bold">
              {paymentMethod?.masked_number ?? "등록된 결제수단 없음"}
            </h2>
            <p className="mt-4 text-gray-600">
              상태: {paymentMethod?.status ?? "-"}
            </p>
            <Link
              href="/billing/payment-method"
              className="mt-6 inline-flex rounded-xl bg-[#5B47E0] px-5 py-3 font-semibold text-white"
            >
              결제수단 변경하기
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}