'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { FadeIn } from '@/components/fade-in'
import { motion } from 'framer-motion'

export function PortfolioSection() {
  const projects = [
    {
      title: 'Terra Flow',
      category: 'Booking Platform',
      description: 'A demo booking platform for fitness studios. Members browse the schedule and book classes online, while studio owners manage instructors, track attendance, and handle memberships—no phone tag required.',
      image: '/terra-flow/images/snapshot.png',
      result: 'Demo Project',
      href: '/projects/terra-flow',
    },
    {
      title: 'TradeFlow',
      category: 'Builder CRM',
      description: 'Quote-to-invoice platform for a residential builder. Generates professional quotes in minutes, tracks jobs, and gets paid faster with online invoicing.',
      image: '/portfolio/tradeflow.png',
      result: '80% faster quotes',
      href: null,
    },
    {
      title: 'Kindred Goods',
      category: 'Online Store',
      description: 'E-commerce website for a local homewares retailer. Beautiful product pages, simple checkout, and inventory that syncs with their physical shop.',
      image: '/portfolio/kindred-goods.png',
      result: '$0 → $12k/mo online',
      href: null,
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
          {projects.map((project, index) => {
            const cardContent = (
              <Card className="overflow-hidden group border-none shadow-none bg-transparent h-full flex flex-col rounded-none">
                    <div className="aspect-video relative rounded-xl overflow-hidden bg-muted mb-6 border shadow-sm group-hover:shadow-md transition-all">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                      >
                        {project.href ? (
                          <Image
                            src={project.image}
                            alt={project.title}
                            fill
                            className="object-cover object-top"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20 bg-muted">
                            <span className="text-4xl font-bold">{project.title[0]}</span>
                          </div>
                        )}
                      </motion.div>
                    </div>
                    <CardContent className="p-0 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-primary">{project.category}</div>
                        {project.href && (
                          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-muted-foreground mb-4 text-base flex-1">
                        {project.description}
                      </p>
                      <div className="mt-auto">
                        <span className="flex items-center justify-center w-full px-4 py-2 bg-green-700 text-sm font-medium text-white">
                          {project.result}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )

            return (
              <FadeIn key={project.title} delay={index * 0.1}>
                {project.href ? (
                  <Link href={project.href} target="_blank" className="block cursor-pointer">
                    {cardContent}
                  </Link>
                ) : (
                  <div>{cardContent}</div>
                )}
              </FadeIn>
            )
          })}
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




