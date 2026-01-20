'use client'

import { FadeIn } from '@/components/fade-in'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: "How does pricing work?",
    answer: "It starts with a free 15-minute call to understand your project. If it's a good fit, we do a paid 1-hour deep-dive consultation to scope everything properly—and that fee gets credited toward your project if you move forward. From there, it's fixed project pricing with a deposit structure. No hourly billing, no surprise invoices."
  },
  {
    question: "What's your typical timeline?",
    answer: "MVPs and simpler apps take 2-4 weeks. More complex applications with integrations and advanced features typically take 4-8 weeks. We'll scope it out together on our discovery call and give you a realistic timeline before we start."
  },
  {
    question: "Do I need to be technical?",
    answer: "Not at all. Most of our clients are non-technical founders. You bring the vision and business knowledge—we handle all the technical decisions, architecture, and implementation. We'll explain things in plain English and keep you updated with weekly demos."
  },
  {
    question: "What happens after launch?",
    answer: "You own your code completely. After launch, you can take the codebase and run with it, hire your own team, or we can continue managing it for you on a retainer basis. We provide full documentation and handoff either way."
  },
  {
    question: "What if I need changes during the project?",
    answer: "We build in flexibility. Small changes and refinements are included—that's why we do weekly demos, so you can give feedback early before anything is set in stone. If you want to pivot significantly, we'll re-scope together and adjust the timeline."
  },
  {
    question: "What's your tech stack?",
    answer: "We primarily build with Next.js and React for web applications, with Supabase for backend services (database, authentication, storage). For mobile apps, we use React Native, Swift, or Kotlin—whatever's the right fit for your project. We pick the best tools for each situation."
  },
  {
    question: "What projects are NOT a good fit?",
    answer: "We focus on building new products, not maintaining legacy code. We also don't take on crypto/Web3 projects—it's not our specialty. If you're looking to build a web app, mobile app, or MVP from scratch, we're probably a great fit."
  },
]

export function FAQSection() {
  return (
    <section className="py-24 px-4 bg-muted/30" id="faq">
      <div className="container mx-auto max-w-3xl">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know before we start building.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-background border rounded-xl px-6 data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left text-lg font-medium hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Still have questions?
            </p>
            <a
              href="#contact"
              className="text-primary font-medium hover:underline"
            >
              Book a free call →
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
