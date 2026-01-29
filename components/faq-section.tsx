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
    answer: "It starts with a free 15-minute call to understand your project. If it's a good fit, I do a paid 1-hour deep-dive consultation to scope everything properly—and that fee gets credited toward your project if you move forward. From there, it's fixed project pricing with a deposit structure. No hourly billing, no surprise invoices."
  },
  {
    question: "What's your typical timeline?",
    answer: "MVPs take 2-4 weeks. Web apps with integrations and dashboards typically take 4-8 weeks. Complex or multi-platform projects take 8-12 weeks. We'll scope it out together on a discovery call and I'll give you a realistic timeline before I start."
  },
  {
    question: "Do I need to be technical?",
    answer: "Not at all. Most of my clients are non-technical founders. You bring the vision and business knowledge—I handle all the technical decisions, architecture, and implementation. I'll explain things in plain English and keep you updated with weekly demos."
  },
  {
    question: "What happens after launch?",
    answer: "You own your code completely. After launch, you can take the codebase and run with it, hire your own team, or I can continue managing it for you on a retainer basis. I provide full documentation and handoff either way."
  },
  {
    question: "What if I need changes during the project?",
    answer: "I build in flexibility. Small changes and refinements are included—that's why I do weekly demos, so you can give feedback early before anything is set in stone. If you want to pivot significantly, we'll re-scope together and adjust the timeline."
  },
  {
    question: "What's your tech stack?",
    answer: "I primarily build with Next.js and React for web applications, with Supabase for backend services (database, authentication, storage). For mobile apps, I use React Native, Swift, or Kotlin—whatever's the right fit for your project. I pick the best tools for each situation."
  },
  {
    question: "What projects are NOT a good fit?",
    answer: "I focus on building new products, not maintaining legacy code. I also don't take on crypto/Web3 projects—it's not my specialty. If you're looking to build a web app, mobile app, or MVP from scratch, I'm probably a great fit."
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

      </div>
    </section>
  )
}
