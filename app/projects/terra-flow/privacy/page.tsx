import { Header } from "@/components/terra-flow/header"
import { Footer } from "@/components/terra-flow/footer"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-24 max-w-3xl">
        <h1 className="text-4xl font-serif mb-8">Privacy Policy</h1>

        <div className="prose prose-neutral max-w-none space-y-6 text-muted-foreground">
          <p>
            At Terra Flow Pilates, we are committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your personal information.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Information We Collect</h2>
          <p>
            We collect information you provide directly, including your name, email address, phone number, and payment details when you book classes or purchase memberships.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">How We Use Your Information</h2>
          <p>
            Your information is used to process bookings, send class reminders, and communicate important updates about our studio and services.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Contact Us</h2>
          <p>
            If you have questions about this privacy policy, please contact us at hello@terraflow.com.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  )
}
