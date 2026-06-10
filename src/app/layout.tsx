import "../styles/globals.css";
import "./source-home/source-home.css";
import Script from "next/script";
import type { ReactNode } from "react";

const siteTitle = "리플로 Replo | CS 운영 대행 · 고객센터 자동화 · CX 운영 설계";
const siteDescription =
  "CS 운영 대행부터 FAQ, 응대 기준, 반복 문의 자동화, VOC 리포트까지 고객센터 운영 구조를 함께 설계하고 운영합니다.";

export const metadata = {
  metadataBase: new URL("https://replo.kr"),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "https://replo.kr",
    siteName: "Replo",
    images: [
      {
        url: "/og-image.png",
        width: 1920,
        height: 1080,
        alt: "Replo",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <noscript>
          <img
            alt=""
            height="1"
            src="https://www.facebook.com/tr?id=1656182135616169&ev=PageView&noscript=1"
            style={{ display: "none" }}
            width="1"
          />
        </noscript>
        {children}
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
            fbq('init', '1656182135616169');
            fbq('track', 'PageView');
          `}
        </Script>
        <Script id="replo-channelio" strategy="afterInteractive">
          {`
            (function() {
              var w = window;
              if (!w.ChannelIO) {
                var ch = function(){ch.c(arguments);};
                ch.q = [];
                ch.c = function(args){ch.q.push(args);};
                w.ChannelIO = ch;
              }
              if (!document.getElementById('replo-channelio-script')) {
                var s = document.createElement('script');
                s.id = 'replo-channelio-script';
                s.type = 'text/javascript';
                s.async = true;
                s.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js';
                document.body.appendChild(s);
              }
              if (!w.ReploChannelIOBooted) {
                w.ReploChannelIOBooted = true;
                w.ChannelIOInitialized = true;
                w.ChannelIO('boot', {
                  pluginKey: '2d035849-6340-4164-a114-1be800d9cc6e'
                });
              }
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
