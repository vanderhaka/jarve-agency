import { Header } from "@/components/terra-flow/header"
import { Footer } from "@/components/terra-flow/footer"
import { ScheduleCalendar } from "@/components/terra-flow/schedule-calendar"

export default function SchedulePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-32 pb-16 bg-card">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-primary uppercase tracking-[0.3em] text-sm mb-4">Classes</p>
          <h1 className="text-4xl md:text-6xl font-light mb-6">
            Class <span className="font-semibold">Schedule</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find the perfect class for your schedule. From early morning energizers to evening wind-downs, we&apos;ve
            got you covered.
          </p>
        </div>
      </section>
      <ScheduleCalendar />
      <Footer />
    </main>
  )
}
