"use client"

import Image from "next/image"
import { useState } from "react"
import { X, Instagram, Mail } from "lucide-react"

const team = [
  {
    name: "Maya Chen",
    role: "Founder & Lead Instructor",
    image: "/terra-flow/images/instructor-maya.jpg",
    bio: "With over 15 years of experience, Maya founded Terra Flow to create a space where movement becomes meditation. She holds certifications from the Pilates Method Alliance and specializes in postural alignment and injury prevention.",
    specialties: ["Classical Pilates", "Postural Alignment", "Injury Rehabilitation"],
    certifications: ["PMA Certified", "BASI Pilates", "Polestar Rehabilitation"],
  },
  {
    name: "Elena Rodriguez",
    role: "Reformer Specialist",
    image: "/terra-flow/images/instructor-elena.jpg",
    bio: "Elena brings energy and precision to every class. A former professional dancer, she discovered pilates during rehabilitation and fell in love with its transformative power. Her classes are known for their creative sequences and attention to detail.",
    specialties: ["Reformer Training", "Dance-Inspired Movement", "Power Pilates"],
    certifications: ["Balanced Body Certified", "Stott Pilates", "ACE Personal Trainer"],
  },
  {
    name: "Sarah Kim",
    role: "Rehabilitation Expert",
    image: "/terra-flow/images/instructor-sarah.jpg",
    bio: "Sarah combines her physical therapy background with pilates expertise to help clients recover from injuries and build sustainable strength. Her gentle, patient approach makes her classes accessible to all.",
    specialties: ["Pre/Post-natal", "Back Care", "Senior Fitness"],
    certifications: ["DPT", "PMA Certified", "Prenatal Pilates Specialist"],
  },
  {
    name: "Jordan Taylor",
    role: "Movement Therapist",
    image: "/terra-flow/images/instructor-jordan.jpg",
    bio: "Jordan brings a holistic approach to movement, integrating elements of yoga, somatic work, and classical pilates. His classes focus on mindful movement and body awareness.",
    specialties: ["Somatic Movement", "Mat Work", "Breathwork"],
    certifications: ["GYROTONIC®", "Pilates Collective", "RYT-500"],
  },
  {
    name: "Priya Sharma",
    role: "Strength & Conditioning",
    image: "/terra-flow/images/instructor-priya.jpg",
    bio: "Priya specializes in athletic performance and brings an energetic, challenging approach to pilates. Her background in sports science ensures scientifically-backed training methods.",
    specialties: ["Athletic Training", "Power Pilates", "Sports Recovery"],
    certifications: ["CSCS", "Balanced Body", "Sports Rehabilitation"],
  },
]

export function TeamGrid() {
  const [selectedMember, setSelectedMember] = useState<(typeof team)[0] | null>(null)

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <button key={index} onClick={() => setSelectedMember(member)} className="group text-left">
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-6">
                <Image
                  src={member.image || "/placeholder.svg"}
                  alt={member.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity text-sm uppercase tracking-widest">
                    View Profile
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-medium group-hover:text-primary transition-colors">{member.name}</h3>
              <p className="text-muted-foreground">{member.role}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={() => setSelectedMember(null)} />
          <div className="relative bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid md:grid-cols-2">
              <div className="relative aspect-[3/4] md:aspect-auto">
                <Image
                  src={selectedMember.image || "/placeholder.svg"}
                  alt={selectedMember.name}
                  fill
                  className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
                />
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <h2 className="text-3xl font-light mb-1">{selectedMember.name}</h2>
                  <p className="text-primary uppercase tracking-widest text-sm">{selectedMember.role}</p>
                </div>

                <p className="text-muted-foreground leading-relaxed">{selectedMember.bio}</p>

                <div>
                  <h4 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.specialties.map((specialty, i) => (
                      <span key={i} className="px-3 py-1 bg-secondary rounded-full text-sm">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Certifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.certifications.map((cert, i) => (
                      <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <a
                    href="#"
                    className="p-2 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a
                    href="#"
                    className="p-2 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
                  >
                    <Mail className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
