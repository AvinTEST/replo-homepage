"use client";

// Loads the Facebook Pixel base snippet and tracks PageView on initial load and
// on every client-side route change. Renders nothing (and loads nothing) when
// NEXT_PUBLIC_FACEBOOK_PIXEL_ID is not set, so the pixel safely no-ops.
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { FACEBOOK_PIXEL_ID, isPixelEnabled, pixelPageView } from "@/lib/meta/pixel";

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The base snippet already fires the first PageView on load, so we skip the
  // initial effect run and only track subsequent route changes. This avoids the
  // duplicate/missing PageView problem with the App Router.
  const skippedInitial = useRef(false);

  useEffect(() => {
    if (!isPixelEnabled()) return;
    if (!skippedInitial.current) {
      skippedInitial.current = true;
      return;
    }
    pixelPageView();
  }, [pathname, searchParams]);

  return null;
}

export function MetaPixel() {
  if (!isPixelEnabled()) {
    return null;
  }

  return (
    <>
      <Script id="replo-meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${FACEBOOK_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
