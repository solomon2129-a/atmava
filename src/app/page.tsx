import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { PhilosophySection } from "@/components/home/PhilosophySection";
import { ProgramsSection } from "@/components/home/ProgramsSection";
import { ExperienceSection } from "@/components/home/ExperienceSection";
import { CTASection } from "@/components/home/CTASection";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <PhilosophySection />
      <ProgramsSection />
      <ExperienceSection />
      <CTASection />
      <Footer />
    </main>
  );
}
