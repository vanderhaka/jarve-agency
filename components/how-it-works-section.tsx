'use client'

import { FadeIn } from '@/components/fade-in'
import { MessageSquare, Rocket, TrendingUp } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: MessageSquare,
    title: 'Scope & Plan',
    subtitle: 'Week 1',
    description: 'Free call to understand your business. Then a paid deep-dive to nail the scope, timeline, and fixed-price quote.',
  },
  {
    number: '02',
    icon: Rocket,
    title: 'Build & Demo',
    subtitle: 'Weeks 2–3',
    description: 'I build. You see progress every week with live demos. Feedback goes straight into the next sprint.',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Launch & Iterate',
    subtitle: 'Week 4',
    description: 'Your product goes live. I stick around to make sure everything runs smoothly and iterate on feedback.',
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-24 px-4 bg-slate-950 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] opacity-30" />

      <div className="container mx-auto relative z-10">
        <FadeIn>
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How it works</h2>
            <p className="text-xl text-slate-400">
              From first conversation to live product — with weekly demos and direct access to me.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <FadeIn key={step.number} delay={index * 0.15}>
                <div className="relative">
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/50 to-transparent" />
                  )}

                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Icon className="w-10 h-10 text-primary" />
                      </div>
                      <span className="absolute -top-[26px] right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                        {step.number}
                      </span>
                    </div>
                    {step.subtitle && (
                      <span className="text-sm font-medium text-primary mb-1 block">{step.subtitle}</span>
                    )}
                    <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                    <p className="text-slate-400 text-lg leading-relaxed">
                      {step.description}
                    </p>
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
