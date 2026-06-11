import { permanentRedirect } from "next/navigation";

export default function DiagnosisRedirectPage() {
  permanentRedirect("/contact");
}
