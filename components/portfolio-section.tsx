'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { FadeIn } from '@/components/fade-in'
import { motion } from 'framer-motion'

export function PortfolioSection() {
  const clientWork = [
    {
      title: 'Diggable',
      category: 'Marketplace',
      description: 'Architectural salvage marketplace connecting buyers with antique dealers nationwide. Browse thousands of vintage fixtures, fireplace mantels, and reclaimed materials from trusted shops.',
      image: '/portfolio/diggable.png',
      result: 'Live Product',
      href: '/work/diggable',
    },
  ]

  const experiments = [
    {
      title: 'BlurbBuddy',
      category: 'AI Book Discovery',
      description: 'AI-powered book recommendation engine that helps readers find their next great read. Ask for suggestions by mood, topic, or similar titles and get personalized recommendations instantly.',
      image: '/portfolio/blurbbuddy.png',
      result: 'Live Product',
      href: '/work/blurbbuddy',
    },
    {
      title: 'Terra Flow',
      category: 'Booking Platform',
      description: 'A demo booking platform for fitness studios. Members browse the schedule and book classes online, while studio owners manage instructors, track attendance, and handle memberships—no phone tag required.',
      image: '/terra-flow/images/snapshot.png',
      result: 'Demo Project',
      href: '/projects/terra-flow',
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
                Projects I&apos;ve shipped—from MVPs to production apps.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Client Work Section */}
        <FadeIn delay={0.1}>
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-6">Client Work</h3>
          </div>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {clientWork.map((project, index) => {
            const cardContent = (
              <Card className="overflow-hidden group border-none shadow-none bg-transparent h-full flex flex-col rounded-none">
                    <div className="aspect-video relative rounded-xl overflow-hidden bg-muted mb-6 border shadow-sm group-hover:shadow-md transition-all">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                      >
                        {project.image ? (
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
              <FadeIn key={project.title} delay={0.2 + index * 0.1} className="h-full">
                {project.href ? (
                  <Link href={project.href} className="block cursor-pointer h-full">
                    {cardContent}
                  </Link>
                ) : (
                  <div className="h-full">{cardContent}</div>
                )}
              </FadeIn>
            )
          })}
        </div>

        {/* Experiments & Side Projects Section */}
        <FadeIn delay={0.3}>
          <div className="mb-4">
            <h3 className="text-2xl font-bold mb-2">Experiments & Side Projects</h3>
            <p className="text-muted-foreground mb-6">Personal projects built to explore new tech and solve my own problems.</p>
          </div>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-8">
          {experiments.map((project, index) => {
            const cardContent = (
              <Card className="overflow-hidden group border-none shadow-none bg-transparent h-full flex flex-col rounded-none">
                    <div className="aspect-video relative rounded-xl overflow-hidden bg-muted mb-6 border shadow-sm group-hover:shadow-md transition-all">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                      >
                        {project.image ? (
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
              <FadeIn key={project.title} delay={0.4 + index * 0.1} className="h-full">
                {project.href ? (
                  <Link href={project.href} className="block cursor-pointer h-full">
                    {cardContent}
                  </Link>
                ) : (
                  <div className="h-full">{cardContent}</div>
                )}
              </FadeIn>
            )
          })}
        </div>
        
      </div>
    </section>
  )
}




