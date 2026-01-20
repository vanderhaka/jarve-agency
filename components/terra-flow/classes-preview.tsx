import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/terra-flow/ui/button"
import { ArrowRight, Clock, Users } from "lucide-react"

const classes = [
  {
    name: "Foundation Flow",
    description: "Perfect for beginners. Learn the fundamentals of pilates with focus on breath and alignment.",
    duration: "50 min",
    level: "Beginner",
    image: "/terra-flow/images/class-foundation.jpg",
  },
  {
    name: "Reformer Sculpt",
    description: "Dynamic reformer work to build strength, increase flexibility, and tone your entire body.",
    duration: "55 min",
    level: "All Levels",
    image: "/terra-flow/images/class-reformer.jpg",
  },
  {
    name: "Power Pilates",
    description: "High-intensity pilates combining cardio and strength for an energizing full-body workout.",
    duration: "45 min",
    level: "Advanced",
    image: "/terra-flow/images/class-power.jpg",
  },
]

export function ClassesPreview() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <p className="text-primary uppercase tracking-[0.3em] text-sm mb-4">Our Classes</p>
            <h2 className="text-4xl md:text-5xl font-light">
              Find Your <span className="font-semibold">Practice</span>
            </h2>
          </div>
          <Link href="/projects/terra-flow/schedule">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 bg-transparent">
              View Full Schedule
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes.map((cls, index) => (
            <Link key={index} href="/projects/terra-flow/schedule" className="group cursor-pointer block">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-6">
                <Image
                  src={cls.image || "/placeholder.svg"}
                  alt={cls.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors duration-300" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {cls.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {cls.level}
                  </span>
                </div>
                <h3 className="text-2xl font-medium group-hover:text-primary transition-colors">{cls.name}</h3>
                <p className="text-muted-foreground leading-relaxed">{cls.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
