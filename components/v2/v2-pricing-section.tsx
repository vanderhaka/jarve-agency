'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/fade-in'
import { Check, Shield, Eye, CreditCard } from 'lucide-react'

const tiers = [
  {
    name: 'MVP — Validate Fast',
    price: '$5–12K',
    description: 'Go from idea to working product. Get real user feedback before you invest everything.',
    timeline: '2–4 weeks',
    includes: [
      'Core features that prove your idea',
      'User auth & responsive design',
      'Deployed and ready for users',
      '1 week of post-launch support',
    ],
  },
  {
    name: 'Web App — Replace the Duct Tape',
    price: '$12–25K',
    description: 'A real application your team uses daily. No more spreadsheets, no more workarounds.',
    timeline: '4–8 weeks',
    includes: [
      'Everything in MVP',
      'Integrations with your existing tools',
      'Admin dashboard & reporting',
      '2 weeks of post-launch support',
    ],
    featured: true,
  },
  {
    name: 'Complex Project — Built to Scale',
    price: 'Custom pricing',
    description: 'Multi-platform builds, AI/automation, or enterprise-grade requirements.',
    timeline: '8–12 weeks',
    includes: [
      'Everything in Web App',
      'Custom architecture',
      'Ongoing support options',
      "Let's scope it together",
    ],
  },
]

const guarantees = [
  {
    icon: Eye,
    title: 'Weekly demos',
    description: 'You see progress every 7 days. No disappearing acts.',
  },
  {
    icon: CreditCard,
    title: 'Milestone payments',
    description: 'You only pay as we hit checkpoints. Not upfront.',
  },
  {
    icon: Shield,
    title: 'Satisfaction guarantee',
    description: "Not happy after week 1? Full refund. No questions asked.",
  },
]

export function V2PricingSection() {
  return (
    <section className="py-24 px-4 bg-[hsl(35,15%,93%)]/50 relative overflow-hidden" id="pricing">
      <div className="container mx-auto relative z-10">
        <FadeIn>
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Fixed-price quotes. No hourly surprises.</h2>
            <p className="text-xl text-muted-foreground">
              Every project gets a fixed price before work begins. You know exactly what you&apos;re paying.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {tiers.map((tier, index) => (
            <FadeIn key={tier.name} delay={index * 0.1}>
              <Card className={`h-full border shadow-sm hover:shadow-md transition-all duration-300 bg-[hsl(40,20%,97%)] ${tier.featured ? 'border-[hsl(140,18%,38%)]/40 ring-2 ring-[hsl(140,18%,38%)]/15' : 'border-[hsl(35,15%,82%)]'}`}>
                <CardHeader>
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <div className="text-3xl font-bold mt-2">{tier.price}</div>
                  <p className="text-muted-foreground text-sm mt-1">{tier.description}</p>
                  <p className="text-sm font-medium text-[hsl(140,18%,38%)] mt-2">Timeline: {tier.timeline}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tier.includes.map((item) => (
                      <li key={item} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-5 h-5 rounded-full bg-[hsl(140,18%,38%)]/10 flex items-center justify-center flex-shrink-0 mr-2.5">
                          <Check className="w-3 h-3 text-[hsl(140,18%,38%)]" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.2}>
          <p className="text-center text-muted-foreground text-sm mb-16">
            What affects price? User count, integrations, and data complexity.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {guarantees.map((g) => {
              const Icon = g.icon
              return (
                <div key={g.title} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[hsl(140,18%,38%)]/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-[hsl(140,18%,38%)]" />
                  </div>
                  <h3 className="font-semibold mb-1">{g.title}</h3>
                  <p className="text-sm text-muted-foreground">{g.description}</p>
                </div>
              )
            })}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
