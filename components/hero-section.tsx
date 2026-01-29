'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { FadeIn } from '@/components/fade-in'
import { motion } from 'framer-motion'

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-73px)] flex items-center justify-center px-4 pt-8 pb-20 bg-background overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.2, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 blur-[100px]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
        className="absolute right-10 top-20 -z-10 h-[250px] w-[250px] rounded-full bg-blue-500/20 blur-[120px]"
      />

      <div className="container mx-auto text-center space-y-8 max-w-5xl">
        <FadeIn delay={0.2}>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground">
            Your business has{' '}
            <span className="bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent">
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
            <Button asChild size="lg" className="h-14 px-8 rounded-full text-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white border-0 shadow-lg shadow-green-500/30 hover:shadow-green-500/40 hover:scale-105 transition-all group">
              <Link href="#contact" className="flex items-center gap-2">
                Request a Call
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
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
