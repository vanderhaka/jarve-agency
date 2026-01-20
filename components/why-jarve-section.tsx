'use client'

import { FadeIn } from '@/components/fade-in'
import { motion } from 'framer-motion'
import { Building2, User, Globe, Check, X } from 'lucide-react'

const comparisons = [
  {
    title: "vs. Traditional Agencies",
    icon: Building2,
    color: "blue",
    points: [
      { text: "5x faster delivery", ours: true },
      { text: "5x more affordable", ours: true },
      { text: "Same quality, modern stack", ours: true },
      { text: "Direct founder access", ours: true },
    ],
    theirPain: "6+ month timelines, $100K+ budgets, layers of account managers",
  },
  {
    title: "vs. Freelancers",
    icon: User,
    color: "purple",
    points: [
      { text: "Reliable & available", ours: true },
      { text: "Clear communication", ours: true },
      { text: "Project management included", ours: true },
      { text: "Ongoing support available", ours: true },
    ],
    theirPain: "Ghosting, missed deadlines, 'I'll get to it next week'",
  },
  {
    title: "vs. Offshore Teams",
    icon: Globe,
    color: "green",
    points: [
      { text: "Same timezone", ours: true },
      { text: "No language barrier", ours: true },
      { text: "Quality assurance built-in", ours: true },
      { text: "Cultural alignment", ours: true },
    ],
    theirPain: "12-hour delays, miscommunication, rework cycles",
  },
]

const colorClasses = {
  blue: {
    header: "bg-gradient-to-r from-blue-600 to-blue-500",
    icon: "text-white",
  },
  purple: {
    header: "bg-gradient-to-r from-purple-600 to-purple-500",
    icon: "text-white",
  },
  green: {
    header: "bg-gradient-to-r from-emerald-600 to-emerald-500",
    icon: "text-white",
  },
}

export function WhyJarveSection() {
  return (
    <section className="py-24 px-4 bg-muted/30 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="container mx-auto relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="text-sm font-medium text-primary">The JARVE Difference</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Why founders choose us
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get agency-quality work at freelancer speed and startup-friendly prices.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {comparisons.map((comparison, index) => {
            const colors = colorClasses[comparison.color as keyof typeof colorClasses]
            const Icon = comparison.icon

            return (
              <FadeIn key={comparison.title} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="h-full"
                >
                  <div className="h-full rounded-2xl bg-background border border-border/50 hover:shadow-xl transition-all overflow-hidden">
                    {/* Solid color header block */}
                    <div className={`${colors.header} px-6 py-5`}>
                      <div className="flex items-center gap-3">
                        <Icon className={`w-6 h-6 ${colors.icon}`} />
                        <h3 className="text-lg font-semibold text-white">{comparison.title}</h3>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Their pain point */}
                      <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                        <div className="flex items-start gap-3">
                          <X className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-red-700 dark:text-red-300">{comparison.theirPain}</p>
                        </div>
                      </div>

                      {/* Our advantages */}
                      <div className="space-y-4">
                        {comparison.points.map((point) => (
                          <div key={point.text} className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{point.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>
            )
          })}
        </div>

        {/* Bottom tagline */}
        <FadeIn delay={0.4}>
          <p className="text-center mt-12 text-muted-foreground">
            <span className="font-semibold text-foreground">The best of all worlds:</span>{' '}
            Speed of AI, quality of experts, price of efficiency.
          </p>
        </FadeIn>
      </div>
    </section>
  )
}
