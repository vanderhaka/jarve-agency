'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { ArrowRight, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { FadeIn } from '@/components/fade-in'
import { motion } from 'framer-motion'

export function PortfolioSection() {
  const projects = [
    {
      title: 'Form Studio',
      category: 'Booking Platform',
      description: 'Online booking and class management for a growing Pilates studio. Members book classes, manage subscriptions, and instructors track attendance—all in one place.',
      image: '/portfolio/form-studio.png',
      result: 'Bookings up 60%',
    },
    {
      title: 'TradeFlow',
      category: 'Builder CRM',
      description: 'Quote-to-invoice platform for a residential builder. Generates professional quotes in minutes, tracks jobs, and gets paid faster with online invoicing.',
      image: '/portfolio/tradeflow.png',
      result: 'Quoting time cut by 80%',
    },
    {
      title: 'Kindred Goods',
      category: 'Online Store',
      description: 'E-commerce website for a local homewares retailer. Beautiful product pages, simple checkout, and inventory that syncs with their physical shop.',
      image: '/portfolio/kindred-goods.png',
      result: 'Online sales from $0 to $12k/mo',
    },
  ]

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-muted/30 to-background" id="portfolio">
      <div className="container mx-auto">
        <FadeIn>
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Real Results</h2>
              <p className="text-xl text-muted-foreground">
                Fictional examples of what we build—and the outcomes that matter.
              </p>
            </div>
            <Button variant="outline" className="hidden md:inline-flex">
              View All Projects <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </FadeIn>
        
        <div className="grid md:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <FadeIn key={project.title} delay={index * 0.1}>
              <Card className="overflow-hidden group border-none shadow-none bg-transparent h-full flex flex-col">
                <div className="aspect-video relative rounded-xl overflow-hidden bg-muted mb-6 border shadow-sm group-hover:shadow-md transition-all">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center text-muted-foreground/20 bg-muted"
                  >
                    {/* In a real app, use next/image with actual screenshots */}
                    <Image
                       src={project.image}
                       alt={project.title}
                       width={40}
                       height={40}
                       className="opacity-50"
                    />
                  </motion.div>
                </div>
                <CardContent className="p-0 flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-primary">{project.category}</div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2 text-base">
                    {project.description}
                  </p>
                  <div className="mt-auto">
                    <span className="inline-flex items-center px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-sm font-medium text-green-600 dark:text-green-400">
                      {project.result}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
        
        <FadeIn delay={0.4}>
          <div className="mt-12 text-center md:hidden">
            <Button variant="outline">
              View All Projects <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}




