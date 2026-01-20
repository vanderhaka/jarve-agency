import { Header } from "@/components/terra-flow/header"
import { Footer } from "@/components/terra-flow/footer"
import { ProfileDashboard } from "@/components/terra-flow/profile-dashboard"

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-4">My Profile</h1>
          <p className="text-lg text-muted-foreground">
            Manage your account, track your progress, and view your bookings
          </p>
        </div>
      </section>

      <ProfileDashboard />

      <Footer />
    </main>
  )
}
