import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Terra Flow Pilates | Mind Body Movement",
  description: "Find your center through mindful movement. Join our pilates community and transform your practice.",
}

export default function TerraFlowLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="terra-flow font-sans antialiased">
      {children}
    </div>
  )
}
