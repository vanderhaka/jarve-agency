import { Header } from "@/components/terra-flow/header"
import { Footer } from "@/components/terra-flow/footer"
import { PackagesGrid } from "@/components/terra-flow/packages-grid"

export default function PackagesPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-primary uppercase tracking-[0.3em] text-sm mb-4">Membership Options</p>
          <h1 className="text-4xl md:text-6xl font-light mb-6">
            Find Your <span className="font-semibold">Package</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Flexible options designed to fit your lifestyle. Whether you&apos;re just starting out or deepening your
            practice, we have a package for you.
          </p>
        </div>
      </section>
      <PackagesGrid />
      <Footer />
    </main>
  )
}
