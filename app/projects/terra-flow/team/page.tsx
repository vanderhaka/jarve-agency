import { Header } from "@/components/terra-flow/header"
import { Footer } from "@/components/terra-flow/footer"
import { TeamGrid } from "@/components/terra-flow/team-grid"
import { TeamValues } from "@/components/terra-flow/team-values"

export default function TeamPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-32 pb-16 bg-card">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-primary uppercase tracking-[0.3em] text-sm mb-4">Our Team</p>
          <h1 className="text-4xl md:text-6xl font-light mb-6">
            Meet Your <span className="font-semibold">Guides</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our team of certified instructors brings diverse backgrounds and specialties, united by a shared passion for
            helping you move better and feel your best.
          </p>
        </div>
      </section>
      <TeamGrid />
      <TeamValues />
      <Footer />
    </main>
  )
}
