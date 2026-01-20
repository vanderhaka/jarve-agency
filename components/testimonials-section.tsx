'use client'

import { FadeIn } from '@/components/fade-in'
import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    quote: "What I thought may take a day he had done under 2 hours. His knowledge and execution was on point and super professional.",
    author: "Amanda",
    role: "Startup Founder",
    rating: 5,
    highlight: "Done in 2 hours instead of a day",
  },
  {
    quote: "James was fantastic and a pleasure to work with. Can't recommend him highly enough.",
    author: "Jonathan",
    role: "Product Owner",
    project: "Marketplace MVP",
    rating: 5,
    highlight: "Marketplace MVP delivered",
  },
  {
    quote: "Extremely fast and quality delivery of what was asked.",
    author: "Mike",
    role: "App Developer",
    rating: 5,
    highlight: "Fast and quality delivery",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 px-4 bg-background relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(var(--primary-rgb,59,130,246),0.05),transparent_50%)]" />

      <div className="container mx-auto relative z-10">
        <FadeIn>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-green-500 text-green-500" />
                ))}
              </div>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">5.0 on Upwork</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Clients love working with us</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real reviews from real projects. No fluff.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <FadeIn key={testimonial.author} delay={index * 0.1}>
              <motion.div
                whileHover={{ y: -5 }}
                className="h-full"
              >
                <div className="h-full p-6 rounded-2xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors relative">
                  <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />

                  {/* Highlight badge */}
                  <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                    {testimonial.highlight}
                  </div>

                  {/* Stars */}
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-foreground mb-6 leading-relaxed">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="mt-auto">
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
