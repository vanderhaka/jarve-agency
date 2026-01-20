"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"

const testimonials = [
  {
    quote:
      "Terra Flow has completely transformed my relationship with movement. The instructors see you as a whole person, not just a body to train.",
    author: "Jessica M.",
    detail: "Member for 2 years",
  },
  {
    quote:
      "After years of back pain, I finally found relief through their rehabilitation-focused classes. Maya and her team are truly gifted.",
    author: "Robert K.",
    detail: "Member for 1 year",
  },
  {
    quote: "The atmosphere is so welcoming and calming. Every class feels like a retreat from the chaos of daily life.",
    author: "Amanda L.",
    detail: "Member for 6 months",
  },
]

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0)

  const next = () => setCurrent((prev) => (prev + 1) % testimonials.length)
  const prev = () => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)

  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-primary uppercase tracking-[0.3em] text-sm mb-4">Testimonials</p>
          <h2 className="text-4xl md:text-5xl font-light">
            What Our <span className="font-semibold">Community</span> Says
          </h2>
        </div>

        <div className="relative">
          <Quote className="h-16 w-16 text-primary/20 mx-auto mb-8" />

          <div className="text-center space-y-6">
            <p className="text-xl md:text-2xl font-light leading-relaxed text-balance">
              &ldquo;{testimonials[current].quote}&rdquo;
            </p>
            <div>
              <p className="font-medium text-lg">{testimonials[current].author}</p>
              <p className="text-muted-foreground text-sm">{testimonials[current].detail}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-12">
            <button
              onClick={prev}
              className="p-2 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${index === current ? "bg-primary" : "bg-border"}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="p-2 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
