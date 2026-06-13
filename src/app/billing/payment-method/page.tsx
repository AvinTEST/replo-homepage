import { redirect } from "next/navigation";
import { PaymentMethodRequest } from "@/components/billing/PaymentMethodRequest";
import { getCurrentCustomerAccess } from "@/lib/customers/access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PaymentMethodPage() {
  const access = await getCurrentCustomerAccess();
  if (!access) redirect("/login?next=/billing/payment-method");

  const supabase = await createClient();
  const { count } = await supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", access.customer.id);

  return <PaymentMethodRequest hasSubscription={(count ?? 0) > 0} />;
}
