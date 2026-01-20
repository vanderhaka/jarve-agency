'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Smartphone, Rocket, Brain, Code, Layout, Database, Lock } from 'lucide-react'
import Link from 'next/link'
import { FadeIn } from '@/components/fade-in'
import { motion } from 'framer-motion'

export function ServicesSection() {
  const services = [
    {
      icon: Zap,
      title: 'Convert More Visitors',
      description: 'Web apps that load instantly and keep users engaged. Higher rankings, better conversions, more revenue.',
      features: ['Lightning fast', 'Works everywhere', 'SEO-optimized'],
    },
    {
      icon: Smartphone,
      title: 'Reach Users on Mobile',
      description: 'Put your business in your customers\' pockets. From idea to App Store, we handle the entire journey.',
      features: ['Smooth native feel', 'Works offline', 'Instant updates'],
    },
    {
      icon: Rocket,
      title: 'Test Before You Bet',
      description: 'Validate your idea before investing everything. Get to market fast, learn from real users, iterate quickly.',
      features: ['Live in weeks', 'Real user feedback', 'Adapt as you learn'],
    },
    {
      icon: Brain,
      title: 'Automate the Busywork',
      description: 'Let AI handle the tasks eating your team\'s time. Smarter support, instant answers, automated workflows.',
      features: ['24/7 customer support', 'Answers from your data', 'Hands-free operations'],
    },
  ]

  return (
    <section className="py-24 px-4 bg-muted/50 relative overflow-hidden" id="services">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(var(--primary-rgb,59,130,246),0.08),transparent_50%)]" />
      <div className="container mx-auto relative z-10">
        <FadeIn>
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">What we can build for you</h2>
            <p className="text-xl text-muted-foreground">
              Stop paying enterprise prices for software. Modern tools let us deliver more, faster, for less.
            </p>
          </div>
        </FadeIn>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <FadeIn key={service.title} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="h-full"
                >
                  <Card className="h-full border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl mb-2">{service.title}</CardTitle>
                      <CardDescription className="text-base leading-relaxed mb-4">
                        {service.description}
                      </CardDescription>
                      <ul className="space-y-2">
                        {service.features.map((feature) => (
                          <li key={feature} className="flex items-center text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardHeader>
                  </Card>
                </motion.div>
              </FadeIn>
            )
          })}
        </div>
      </div>
    </section>
  )
}

