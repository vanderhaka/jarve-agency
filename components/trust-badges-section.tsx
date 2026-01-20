'use client'

import { FadeIn } from '@/components/fade-in'
import Image from 'next/image'

const techLogos = [
  { name: 'Next.js', src: '/logos/nextjs.svg' },
  { name: 'React', src: '/logos/react.svg' },
  { name: 'Supabase', src: '/logos/supabase.svg' },
  { name: 'Vercel', src: '/logos/vercel.svg' },
  { name: 'OpenAI', src: '/logos/openai.svg' },
  { name: 'Anthropic', src: '/logos/anthropic.svg' },
  { name: 'Cursor', src: '/logos/cursor.svg' },
]

export function TrustBadgesSection() {
  return (
    <section className="py-12 px-4 bg-muted/30 border-y border-border/50">
      <div className="container mx-auto">
        <FadeIn>
          <div className="text-center mb-8">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Built with modern tools
            </p>
          </div>

          {/* Tech logos */}
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 mb-10">
            {techLogos.map((logo) => (
              <div
                key={logo.name}
                className="grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              >
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={120}
                  height={40}
                  className="h-8 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
