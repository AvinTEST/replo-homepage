import { permanentRedirect } from "next/navigation";

export default function LegacyContactSuccessRedirectPage() {
  permanentRedirect("/contact/success");
}
