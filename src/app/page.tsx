import { Navbar } from "@/components/shared/Navbar";
import { Hero } from "@/components/landing/Hero";
import { AgentShowcase } from "@/components/landing/AgentShowcase";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { DemoPreview } from "@/components/landing/DemoPreview";
import { Footer } from "@/components/shared/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Sections */}
      <main className="flex-1">
        <Hero />
        <AgentShowcase />
        <FeatureGrid />
        <DemoPreview />
      </main>

      {/* Chân trang Footer */}
      <Footer />
    </div>
  );
}
