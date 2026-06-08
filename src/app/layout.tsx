import "../styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Replo Homepage",
  description: "Replo CS Operations",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}