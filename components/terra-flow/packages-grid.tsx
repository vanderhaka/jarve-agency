"use client"

import Link from "next/link"
import { Button } from "@/components/terra-flow/ui/button"
import { Check, Sparkles } from "lucide-react"
import { useState } from "react"

const packages = [
  {
    name: "Drop-In",
    price: 35,
    period: "per class",
    description: "Perfect for trying us out or maintaining a flexible schedule.",
    features: ["Single class access", "All class types included", "No commitment required", "Valid for 30 days"],
    popular: false,
  },
  {
    name: "Essential",
    price: 149,
    period: "per month",
    description: "Our most popular option for regular practitioners.",
    features: [
      "8 classes per month",
      "Rollover up to 4 unused classes",
      "10% retail discount",
      "Priority booking",
      "Guest pass (1 per month)",
    ],
    popular: true,
  },
  {
    name: "Unlimited",
    price: 249,
    period: "per month",
    description: "For the dedicated practitioner who wants it all.",
    features: [
      "Unlimited classes",
      "All class types included",
      "15% retail discount",
      "Priority booking",
      "2 guest passes per month",
      "Free mat storage",
    ],
    popular: false,
  },
]

const classPacks = [
  { classes: 5, price: 150, perClass: 30, validity: "3 months" },
  { classes: 10, price: 280, perClass: 28, validity: "6 months" },
  { classes: 20, price: 500, perClass: 25, validity: "12 months" },
]

export function PackagesGrid() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")

  return (
    <section className="py-16 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-muted rounded-full p-1 flex">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "annual"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual (Save 15%)
            </button>
          </div>
        </div>

        {/* Membership Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {packages.map((pkg, index) => {
            const displayPrice =
              billingCycle === "annual" && pkg.period === "per month" ? Math.round(pkg.price * 0.85) : pkg.price

            return (
              <div
                key={index}
                className={`relative rounded-2xl p-8 ${
                  pkg.popular
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-card border border-border"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-accent-foreground px-4 py-1 rounded-full text-xs uppercase tracking-widest font-medium flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold mb-2">{pkg.name}</h3>
                  <p className={`text-sm mb-4 ${pkg.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {pkg.description}
                  </p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-light">${displayPrice}</span>
                    <span className={`text-sm ${pkg.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      /{pkg.period}
                    </span>
                  </div>
                  {billingCycle === "annual" && pkg.period === "per month" && (
                    <p
                      className={`text-xs mt-2 ${pkg.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                    >
                      Billed annually (${displayPrice * 12}/year)
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check
                        className={`h-5 w-5 shrink-0 ${pkg.popular ? "text-primary-foreground" : "text-primary"}`}
                      />
                      <span className={`text-sm ${pkg.popular ? "text-primary-foreground/90" : "text-foreground"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href="/projects/terra-flow/schedule">
                  <Button
                    className={`w-full uppercase tracking-widest text-sm py-6 ${
                      pkg.popular
                        ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>

        {/* Class Packs Section */}
        <div className="text-center mb-12">
          <p className="text-primary uppercase tracking-[0.3em] text-sm mb-4">Class Packs</p>
          <h2 className="text-3xl md:text-4xl font-light mb-4">
            Prefer <span className="font-semibold">Flexibility?</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Purchase a class pack and use them at your own pace. The more you buy, the more you save.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {classPacks.map((pack, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary transition-colors"
            >
              <p className="text-4xl font-light text-primary mb-2">{pack.classes}</p>
              <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Classes</p>
              <p className="text-3xl font-semibold mb-1">${pack.price}</p>
              <p className="text-sm text-muted-foreground mb-4">${pack.perClass} per class</p>
              <p className="text-xs text-muted-foreground mb-6">Valid for {pack.validity}</p>
              <Link href="/projects/terra-flow/schedule">
                <Button
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary/10 bg-transparent"
                >
                  Purchase
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Private Sessions */}
        <div className="mt-24 bg-muted rounded-2xl p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-primary uppercase tracking-[0.3em] text-sm mb-4">Personalized Attention</p>
            <h2 className="text-3xl md:text-4xl font-light mb-4">
              Private <span className="font-semibold">Sessions</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Work one-on-one with our expert instructors for a fully customized experience tailored to your goals,
              whether that&apos;s rehabilitation, athletic performance, or deepening your practice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <div className="text-center">
                <p className="text-3xl font-light">$95</p>
                <p className="text-sm text-muted-foreground">Single Session</p>
              </div>
              <div className="hidden sm:block w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-light">$425</p>
                <p className="text-sm text-muted-foreground">5-Pack (Save $50)</p>
              </div>
              <div className="hidden sm:block w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-light">$800</p>
                <p className="text-sm text-muted-foreground">10-Pack (Save $150)</p>
              </div>
            </div>
            <Link href="/projects/terra-flow/team">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-widest text-sm px-8">
                Meet Our Instructors
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
