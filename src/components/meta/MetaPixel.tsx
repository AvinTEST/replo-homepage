"use client";

import Script from "next/script";

export function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

  if (!pixelId) return null;

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
          fbq('init', '${pixelId}');
          (function(){
            var rnd = (self.crypto && crypto.randomUUID)
              ? crypto.randomUUID()
              : Math.random().toString(36).slice(2);
            var eventId = 'replo_pageview_' + Date.now() + '_' + rnd;
            fbq('track', 'PageView', {}, { eventID: eventId });
            fetch('/api/meta/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventName: 'PageView',
                eventId: eventId,
                eventSourceUrl: location.href
              }),
              keepalive: true
            }).catch(function(){});
          })();
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          height="1"
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          style={{ display: "none" }}
          width="1"
        />
      </noscript>
    </>
  );
}
