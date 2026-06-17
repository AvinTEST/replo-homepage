import type { Metadata } from "next";
import { SourceHome } from "../../components/source-home/SourceHome";

export const metadata: Metadata = {
  title: "Replo source 기반 홈페이지 비교본",
  description: "Claude export의 JSX/CSS 소스 구조를 Next.js로 포팅한 Replo 홈페이지 비교 버전입니다.",
};

export default function SourceHomePage() {
  return <SourceHome />;
}
