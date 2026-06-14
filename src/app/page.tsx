import { headers } from "next/headers";
import { SourceHome } from "../components/source-home/SourceHome";
import { shouldShowPortalLogin } from "../lib/deployment/host";

export default function HomePage() {
  const requestHeaders = headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  return <SourceHome showPortalLogin={shouldShowPortalLogin(host)} />;
}
