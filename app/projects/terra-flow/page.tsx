import { Header } from "@/components/terra-flow/header"
import { HeroSection } from "@/components/terra-flow/hero-section"
import { AboutSection } from "@/components/terra-flow/about-section"
import { ClassesPreview } from "@/components/terra-flow/classes-preview"
import { TeamPreview } from "@/components/terra-flow/team-preview"
import { TestimonialsSection } from "@/components/terra-flow/testimonials-section"
import { CTASection } from "@/components/terra-flow/cta-section"
import { Footer } from "@/components/terra-flow/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <AboutSection />
      <ClassesPreview />
      <TeamPreview />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  )
}
