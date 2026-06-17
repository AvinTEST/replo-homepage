import { SourceHome } from "../components/source-home/SourceHome";

// Public marketing homepage. Rendered statically (no force-dynamic) so it is
// served instantly from the CDN. Auth state, host-based portal-login
// visibility, and login deep-links are resolved client-side inside SourceHome
// after hydration, which avoids a blocking Supabase auth round-trip on every
// visit.
export default function HomePage() {
  return <SourceHome />;
}
