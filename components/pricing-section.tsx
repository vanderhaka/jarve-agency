'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/fade-in'
import { Check, Shield, Eye, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const tiers = [
  {
    name: 'MVP',
    price: '$5–12K',
    description: 'Validate your idea with a working product.',
    timeline: '2–3 weeks',
    includes: [
      'Core feature set',
      'User authentication',
      'Responsive design',
      'Deployment & handoff',
    ],
  },
  {
    name: 'Web App',
    price: '$12–25K',
    description: 'A full application your team or customers will use daily.',
    timeline: '4–6 weeks',
    includes: [
      'Everything in MVP',
      'Advanced integrations',
      'Admin dashboard',
      'Analytics & reporting',
    ],
    featured: true,
  },
  {
    name: 'Complex Project',
    price: "Let's talk",
    description: 'Multi-platform, large-scale, or highly custom builds.',
    timeline: '6–10 weeks',
    includes: [
      'Everything in Web App',
      'Multiple platforms',
      'Custom AI/automation',
      'Ongoing support plan',
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

export function PricingSection() {
  return (
    <section className="py-24 px-4 bg-muted/30 relative overflow-hidden" id="pricing">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(var(--primary-rgb,59,130,246),0.06),transparent_50%)]" />
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
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="h-full"
              >
                <Card className={`h-full border shadow-sm hover:shadow-xl transition-all duration-300 bg-background ${tier.featured ? 'border-primary/50 ring-2 ring-primary/20' : 'border-border/50'}`}>
                  <CardHeader>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <div className="text-3xl font-bold mt-2">{tier.price}</div>
                    <p className="text-muted-foreground text-sm mt-1">{tier.description}</p>
                    <p className="text-sm font-medium text-primary mt-2">Timeline: {tier.timeline}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {tier.includes.map((item) => (
                        <li key={item} className="flex items-center text-sm text-muted-foreground">
                          <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mr-2.5">
                            <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Button asChild className={`w-full mt-6 rounded-full ${tier.featured ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white border-0 hover:shadow-lg hover:shadow-green-500/30' : ''}`} variant={tier.featured ? 'default' : 'outline'}>
                      <Link href="#contact">Book a Free Call</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </FadeIn>
          ))}
        </div>

        {/* Guarantees / Risk Reversal */}
        <FadeIn delay={0.3}>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {guarantees.map((g) => {
              const Icon = g.icon
              return (
                <div key={g.title} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-primary" />
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
