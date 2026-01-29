'use client'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/fade-in'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Check } from 'lucide-react'

export function ServicesSection() {
  const services = [
    {
      image: '/images/services/convert-visitors.jpeg',
      title: 'MVP Development',
      description: 'Validate your idea before investing everything. Get to market fast, learn from real users, iterate quickly.',
      features: ['Live in weeks', 'Real user feedback', 'Adapt as you learn'],
    },
    {
      image: '/images/services/test-before-bet.jpeg',
      title: 'Web Applications',
      description: 'Custom web apps that replace spreadsheets, automate workflows, and actually get used. Built for operations, not marketing.',
      features: ['Lightning fast', 'Works everywhere', 'Built for your process'],
    },
    {
      image: '/images/services/automate-busywork.jpeg',
      title: 'Internal Tools',
      description: 'Dashboards, admin panels, and workflow tools your team will actually use. Built around how you already work.',
      features: ['Custom to your process', 'Integrates with your stack', 'Hands-free operations'],
    },
  ]

  return (
    <section className="py-24 px-4 bg-muted/50 relative overflow-hidden" id="services">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(var(--primary-rgb,59,130,246),0.08),transparent_50%)]" />
      <div className="container mx-auto relative z-10">
        <FadeIn>
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">What I can build for you</h2>
            <p className="text-xl text-muted-foreground">
              Web apps and internal tools — not marketing sites. Modern tools let me deliver more, faster, for less.
            </p>
          </div>
        </FadeIn>
        
        <div className="grid md:grid-cols-3 gap-6">
          {services.map((service, index) => (
              <FadeIn key={service.title} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="h-full"
                >
                  <Card className="h-full border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 bg-background overflow-hidden">
                    <div className="relative h-40 w-full">
                      <Image
                        src={service.image}
                        alt={service.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardHeader className="pt-5">
                      <CardTitle className="text-xl mb-2">{service.title}</CardTitle>
                      <CardDescription className="text-base leading-relaxed mb-4">
                        {service.description}
                      </CardDescription>
                      <ul className="space-y-2.5">
                        {service.features.map((feature) => (
                          <li key={feature} className="flex items-center text-sm text-muted-foreground">
                            <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mr-2.5">
                              <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                            </div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardHeader>
                  </Card>
                </motion.div>
              </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

