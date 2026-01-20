'use client'

import { FadeIn } from '@/components/fade-in'
import { motion } from 'framer-motion'

const stats = [
  {
    value: '5x',
    label: 'Faster than agencies',
    description: 'What takes others 6+ months',
  },
  {
    value: '5x',
    label: 'Lower cost',
    description: 'Same quality, fraction of the price',
  },
  {
    value: '2-4',
    label: 'Weeks to launch',
    description: 'Industry average: 6+ months',
  },
]

export function StatsSection() {
  return (
    <section className="py-16 px-4 bg-gradient-to-r from-primary via-primary to-blue-600 text-primary-foreground relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%)] bg-[length:60px_60px]" />

      <div className="container mx-auto relative z-10">
        <div className="grid md:grid-cols-3 gap-8 md:gap-4">
          {stats.map((stat, index) => (
            <FadeIn key={stat.label} delay={index * 0.1}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="text-center py-4"
              >
                <div className="text-5xl md:text-6xl font-bold mb-2">
                  {stat.value}
                </div>
                <div className="text-xl font-semibold mb-1 opacity-90">
                  {stat.label}
                </div>
                <div className="text-sm opacity-70">
                  {stat.description}
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
