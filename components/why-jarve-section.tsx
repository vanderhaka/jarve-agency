'use client'

import { FadeIn } from '@/components/fade-in'
import { motion } from 'framer-motion'
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

export function WhyJarveSection() {
  return (
    <section className="py-24 px-4 bg-gradient-to-r from-primary/20 via-primary/20 to-blue-600/20 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.04)_25%,rgba(255,255,255,0.04)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.04)_75%)] bg-[length:60px_60px]" />

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
                <motion.div
                  whileHover={{ y: -3 }}
                  className="h-full"
                >
                  <div className="h-full rounded-2xl bg-white border border-gray-300 hover:shadow-lg transition-all p-6 flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{benefit.title}</h3>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>
            )
          })}
        </div>
      </div>
    </section>
  )
}
