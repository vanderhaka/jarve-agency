import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/terra-flow/ui/button"
import { ArrowRight } from "lucide-react"

const team = [
  {
    name: "Maya Chen",
    role: "Founder & Lead Instructor",
    image: "/terra-flow/images/instructor-maya.jpg",
  },
  {
    name: "Elena Rodriguez",
    role: "Reformer Specialist",
    image: "/terra-flow/images/instructor-elena.jpg",
  },
  {
    name: "Sarah Kim",
    role: "Rehabilitation Expert",
    image: "/terra-flow/images/instructor-sarah.jpg",
  },
]

export function TeamPreview() {
  return (
    <section className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-primary uppercase tracking-[0.3em] text-sm mb-4">Our Team</p>
          <h2 className="text-4xl md:text-5xl font-light mb-6">
            Meet Your <span className="font-semibold">Guides</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our certified instructors bring years of experience and a passion for helping you achieve your wellness
            goals.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {team.map((member, index) => (
            <Link key={index} href="/projects/terra-flow/team" className="group text-center block">
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-6">
                <Image
                  src={member.image || "/placeholder.svg"}
                  alt={member.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="text-xl font-medium group-hover:text-primary transition-colors">{member.name}</h3>
              <p className="text-muted-foreground">{member.role}</p>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link href="/projects/terra-flow/team">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 bg-transparent">
              Meet the Full Team
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
