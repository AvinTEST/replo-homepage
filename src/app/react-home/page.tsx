import type { Metadata } from "next";
import { CostSection } from "../../components/home/CostSection";
import { FAQSection } from "../../components/home/FAQSection";
import { FinalCTASection } from "../../components/home/FinalCTASection";
import { HomeHeader } from "../../components/home/HomeHeader";
import { HomeHero } from "../../components/home/HomeHero";
import { PricingSection } from "../../components/home/PricingSection";
import { ProblemSection } from "../../components/home/ProblemSection";
import { ProcessSection } from "../../components/home/ProcessSection";
import { ServiceSection } from "../../components/home/ServiceSection";

export const metadata: Metadata = {
  title: "Replo React 홈페이지 비교본",
  description: "편집 가능한 React 컴포넌트로 구현한 Replo 홈페이지 비교 버전입니다.",
};

export default function ReactHomePage() {
  return (
    <main className="min-h-screen bg-white font-sans text-[#171A2E] antialiased">
      <HomeHeader />
      <HomeHero />
      <ProblemSection />
      <ServiceSection />
      <ProcessSection />
      <CostSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
    </main>
  );
}
