import "../styles/globals.css";
import type { ReactNode } from "react";

const siteTitle = "CS가 더 쉬워지는 곳, Replo";
const siteDescription =
  "AI와 전문 운영팀으로 CS 운영 비용은 낮추고 고객 경험은 높입니다.";

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
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
