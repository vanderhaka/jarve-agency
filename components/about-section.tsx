'use client'

import { FadeIn } from '@/components/fade-in'
import Image from 'next/image'

export function AboutSection() {
  return (
    <section className="py-24 px-4 bg-gradient-to-r from-primary/20 via-primary/20 to-blue-600/20 relative overflow-hidden" id="about">
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.04)_25%,rgba(255,255,255,0.04)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.04)_75%)] bg-[length:60px_60px]" />
      <div className="container mx-auto max-w-5xl relative z-10">
        <FadeIn>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">About</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                I&apos;m James. I ran a painting business for 20 years — and got tired of being held together by spreadsheets, paper, and a dozen disconnected apps.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                So I taught myself to code and built my own. What started as a side hustle became a passion — and now it&apos;s what I do full time. MVPs, internal tools, web apps that replace the duct tape.
              </p>
              <p className="text-lg leading-relaxed font-semibold">
                5 years building production software with Next.js, TypeScript, Supabase, and PostgreSQL.
              </p>
            </div>

            {/* Photo */}
            <div className="relative aspect-square max-w-md mx-auto md:mx-0 rounded-2xl overflow-hidden bg-muted">
              <Image
                src="/images/james.png"
                alt="James"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
