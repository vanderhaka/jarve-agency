'use client'

import { FadeIn } from '@/components/fade-in'
import Image from 'next/image'

export function AboutSection() {
  return (
    <section className="py-24 px-4 bg-background" id="about">
      <div className="container mx-auto max-w-5xl">
        <FadeIn>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">About</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                I&apos;m James. I ran a painting business for 20 years — and got tired of being held together by spreadsheets, paper, and a dozen disconnected apps.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                So I taught myself to code and built my own. What started as a side hustle became a passion — and now it&apos;s what I do full time. MVPs, internal tools, web apps that replace the duct tape.
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
