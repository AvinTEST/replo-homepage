import { redirect } from "next/navigation";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const query = new URLSearchParams({ login: "1" });
  if (searchParams?.error === "auth_failed") {
    query.set("error", "auth_failed");
  }
  redirect(`/?${query.toString()}`);
}
