import { Header } from "@/components/terra-flow/header"
import { Footer } from "@/components/terra-flow/footer"

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-24 max-w-3xl">
        <h1 className="text-4xl font-serif mb-8">Terms of Service</h1>

        <div className="prose prose-neutral max-w-none space-y-6 text-muted-foreground">
          <p>
            Welcome to Terra Flow Pilates. By using our services, you agree to these terms and conditions.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Class Bookings</h2>
          <p>
            Classes must be cancelled at least 12 hours in advance to avoid a late cancellation fee. No-shows will be charged the full class fee or one class credit will be deducted.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Memberships & Packages</h2>
          <p>
            Class packages are valid for 3 months from the date of purchase. Memberships are billed monthly and can be cancelled with 30 days notice.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Health & Safety</h2>
          <p>
            Please inform your instructor of any injuries or health conditions before class. Participation is at your own risk, and we recommend consulting a physician before starting any new exercise program.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Studio Etiquette</h2>
          <p>
            Please arrive 10 minutes before class, silence mobile phones, and respect fellow practitioners by maintaining a quiet environment.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Contact</h2>
          <p>
            For questions about these terms, contact us at hello@terraflow.com.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  )
}
