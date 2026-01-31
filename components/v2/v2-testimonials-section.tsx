'use client'

import { FadeIn } from '@/components/fade-in'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    quote: "James took a 20-year vision and turned it into a working marketplace in 10 weeks.",
    author: "Jonathan Butler",
    role: "Founder, Diggable",
    rating: 5,
    highlight: "20-year vision launched in 10 weeks",
  },
  {
    quote: "Went from idea to working MVP in under a week—gave me what I needed to validate fast.",
    author: "Mike Andrews",
    role: "Startup Founder",
    rating: 5,
    highlight: "Idea to MVP in under a week",
  },
  {
    quote: "Helped me cut through the noise and pivot to what actually worked.",
    author: "Amanda Wickham",
    role: "Startup Founder",
    rating: 5,
    highlight: "Pivoted to what worked",
  },
]

export function V2TestimonialsSection() {
  return (
    <section className="py-20 px-4 bg-background relative overflow-hidden">
      <div className="container mx-auto relative z-10">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Clients love working with me</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real reviews from real projects. No fluff.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <FadeIn key={testimonial.author} delay={index * 0.1}>
              <div className="h-full p-6 rounded-2xl bg-[hsl(35,15%,93%)] border border-[hsl(35,15%,85%)] hover:border-[hsl(140,18%,38%)]/25 transition-colors relative">
                <Quote className="absolute top-4 right-4 w-8 h-8 text-[hsl(140,18%,38%)]/35" />

                <div className="inline-block px-3 py-1 rounded-full bg-[hsl(140,18%,38%)]/25 text-[hsl(140,18%,20%)] text-xs font-medium mb-4">
                  {testimonial.highlight}
                </div>

                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[hsl(35,45%,55%)] text-[hsl(35,45%,55%)]" />
                  ))}
                </div>

                <p className="text-foreground mb-6 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                <div className="mt-auto">
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
