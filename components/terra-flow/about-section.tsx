import Image from "next/image"

export function AboutSection() {
  return (
    <section className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="aspect-square rounded-lg overflow-hidden">
              <Image src="/terra-flow/images/studio-interior.jpg" alt="Our Studio" fill className="object-cover" />
            </div>
            <div className="absolute -bottom-8 -right-8 bg-primary text-primary-foreground p-8 rounded-lg hidden md:block">
              <p className="text-4xl font-light">10+</p>
              <p className="text-sm uppercase tracking-widest">Years of Practice</p>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-primary uppercase tracking-[0.3em] text-sm">Our Philosophy</p>
            <h2 className="text-4xl md:text-5xl font-light leading-tight">
              Movement as <br />
              <span className="font-semibold">Medicine</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              At Terra Flow, we believe pilates is more than exercise—it&apos;s a practice of reconnecting with your
              body. Our method combines classical pilates principles with contemporary understanding of biomechanics.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Every class is thoughtfully curated to meet you where you are, whether you&apos;re recovering from injury,
              building strength, or deepening your practice.
            </p>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div>
                <p className="text-3xl font-light text-primary">500+</p>
                <p className="text-sm text-muted-foreground">Happy Members</p>
              </div>
              <div>
                <p className="text-3xl font-light text-primary">20+</p>
                <p className="text-sm text-muted-foreground">Weekly Classes</p>
              </div>
              <div>
                <p className="text-3xl font-light text-primary">5</p>
                <p className="text-sm text-muted-foreground">Expert Instructors</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
