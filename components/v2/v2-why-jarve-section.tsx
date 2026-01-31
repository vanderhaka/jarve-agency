'use client'

import { FadeIn } from '@/components/fade-in'
import { DollarSign, CheckCircle, Eye, UserCheck } from 'lucide-react'

const benefits = [
  {
    icon: DollarSign,
    title: 'Fixed-price quotes',
    description: 'You know the cost before I start. No hourly bleeding.',
  },
  {
    icon: CheckCircle,
    title: 'Milestone sign-offs',
    description: 'You approve each stage before I move forward.',
  },
  {
    icon: Eye,
    title: 'Weekly demos',
    description: "See real progress. Never wonder what's happening.",
  },
  {
    icon: UserCheck,
    title: 'Direct access',
    description: 'You talk to me, not a project manager.',
  },
]

export function V2WhyJarveSection() {
  return (
    <section className="py-24 px-4 bg-[hsl(35,18%,92%)] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_25%,rgba(255,255,255,0.3)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.3)_75%)] bg-[length:60px_60px]" />

      <div className="container mx-auto relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Why founders choose JARVE
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A process built around transparency and results.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <FadeIn key={benefit.title} delay={index * 0.1}>
                <div className="h-full rounded-2xl bg-[hsl(40,20%,97%)] border border-[hsl(35,15%,82%)] hover:shadow-md transition-all p-6 flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[hsl(140,18%,38%)]/10 border border-[hsl(140,18%,38%)]/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-[hsl(140,18%,38%)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              </FadeIn>
            )
          })}
        </div>
      </div>
    </section>
  )
}
