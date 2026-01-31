'use client'

import { ArrowRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { FadeIn } from '@/components/fade-in'
import { motion } from 'framer-motion'

export function V2HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-73px)] flex items-center justify-center px-4 pt-8 pb-20 bg-background overflow-hidden">
      {/* Subtle warm grid */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#80806608_1px,transparent_1px),linear-gradient(to_bottom,#80806608_1px,transparent_1px)] bg-[size:14px_24px]" />
      {/* Sage green glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-[hsl(140,18%,38%)]/20 blur-[100px]"
      />
      {/* Warm tan glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.12, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
        className="absolute right-10 top-20 -z-10 h-[250px] w-[250px] rounded-full bg-[hsl(35,30%,55%)]/20 blur-[120px]"
      />

      <div className="container mx-auto text-center space-y-8 max-w-5xl">
        <FadeIn delay={0.2}>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground">
            Your business has{' '}
            <span className="bg-gradient-to-r from-[hsl(140,18%,38%)] to-[hsl(145,20%,48%)] bg-clip-text text-transparent">
              outgrown spreadsheets.
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Custom web apps & internal tools. Fixed price. Launched in weeks.
          </p>
          <p className="text-sm md:text-base text-muted-foreground/70 max-w-2xl mx-auto mt-2">
            Most custom software takes 3–6 months. We ship in weeks, not months.
          </p>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="#contact"
              className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full text-lg font-medium bg-[hsl(140,18%,38%)] text-white shadow-md hover:shadow-lg hover:bg-[hsl(140,18%,33%)] hover:scale-105 transition-all group"
            >
              Request a Call
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </FadeIn>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground"
      >
        <ChevronDown className="w-6 h-6" />
      </motion.div>
    </section>
  )
}
