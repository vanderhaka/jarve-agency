'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

// SSR-safe year calculation using useSyncExternalStore
const subscribe = () => () => {}
const getSnapshot = () => new Date().getFullYear()
const getServerSnapshot = () => null as number | null

export function Footer() {
  const currentYear = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return (
    <footer className="bg-zinc-950 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-600/20 via-purple-600/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-600/15 via-cyan-600/10 to-transparent rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Main footer content */}
        <div className="py-16 md:py-24">
          <div className="grid md:grid-cols-12 gap-12 md:gap-8">
            {/* Brand column */}
            <div className="md:col-span-5">
              <Link href="/" className="text-3xl font-bold tracking-tight inline-block mb-6">
                JARVE
              </Link>
              <p className="text-zinc-400 text-lg max-w-sm leading-relaxed">
                We build digital products that help businesses grow. Fast delivery, fair pricing, real results.
              </p>
            </div>

            {/* Navigation columns */}
            <div className="md:col-span-7">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">
                    Navigate
                  </h4>
                  <ul className="space-y-3">
                    {['Services', 'Work', 'Contact'].map((item) => (
                      <li key={item}>
                        <Link
                          href={`#${item.toLowerCase()}`}
                          className="text-zinc-400 hover:text-white transition-colors inline-flex items-center group"
                        >
                          {item}
                          <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">
                    Contact
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <a
                        href="mailto:hello@jarve.agency"
                        className="text-zinc-400 hover:text-white transition-colors"
                      >
                        hello@jarve.agency
                      </a>
                    </li>
                    <li className="text-zinc-500">
                      Adelaide, SA
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-zinc-800 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-zinc-500 text-sm">
            &copy; {currentYear ?? '2024'} JARVE. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="#" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
