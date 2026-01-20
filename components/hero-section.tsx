'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { FadeIn } from '@/components/fade-in'
import { motion, AnimatePresence } from 'framer-motion'

const rotatingWords = [
  { word: 'app', gradient: 'from-blue-500 to-cyan-400', border: 'border-blue-500/50' },
  { word: 'MVP', gradient: 'from-purple-500 to-pink-500', border: 'border-purple-500/50' },
  { word: 'platform', gradient: 'from-orange-500 to-yellow-400', border: 'border-orange-500/50' },
  { word: 'software', gradient: 'from-green-500 to-emerald-400', border: 'border-green-500/50' },
]

export function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

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
            <span className="block">
              Your custom{' '}
              <span className="inline-block relative">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={rotatingWords[wordIndex].word}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`inline-block bg-gradient-to-r ${rotatingWords[wordIndex].gradient} bg-clip-text text-transparent border-b-4 border-dashed ${rotatingWords[wordIndex].border}`}
                  >
                    {rotatingWords[wordIndex].word}
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
            <span className="block mt-2">built in weeks, not months.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            AI-assisted development lets us build enterprise-quality software in <span className="text-foreground font-medium">weeks instead of months</span>—at a fraction of the cost. The $100K project? We can do it for $20K.
          </p>
        </FadeIn>
        
        <FadeIn delay={0.4}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="h-14 px-8 rounded-full text-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white border-0 shadow-lg shadow-green-500/30 hover:shadow-green-500/40 hover:scale-105 transition-all group">
              <Link href="#contact" className="flex items-center gap-2">
                Book a Free Call
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 h-14 rounded-full border-2">
              <Link href="#portfolio">View Our Work</Link>
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

