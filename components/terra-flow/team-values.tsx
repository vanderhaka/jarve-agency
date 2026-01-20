import { Heart, Leaf, Sun, Users } from "lucide-react"

const values = [
  {
    icon: Heart,
    title: "Compassion",
    description: "We meet every body where it is, with patience, understanding, and genuine care for your journey.",
  },
  {
    icon: Leaf,
    title: "Growth",
    description:
      "We believe in continuous learning—for ourselves and our clients. Every class is an opportunity to evolve.",
  },
  {
    icon: Sun,
    title: "Balance",
    description: "True wellness comes from harmony between strength and flexibility, effort and ease, body and mind.",
  },
  {
    icon: Users,
    title: "Community",
    description: "We're more than a studio—we're a supportive community united by our love of mindful movement.",
  },
]

export function TeamValues() {
  return (
    <section className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-primary uppercase tracking-[0.3em] text-sm mb-4">Our Values</p>
          <h2 className="text-4xl md:text-5xl font-light">
            What We <span className="font-semibold">Stand For</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <value.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-3">{value.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
