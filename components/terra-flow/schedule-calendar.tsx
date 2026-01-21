"use client"

import { useState, useMemo, useSyncExternalStore } from "react"
import { Button } from "@/components/terra-flow/ui/button"
import { ChevronLeft, ChevronRight, Clock, User } from "lucide-react"
import { BookingModal } from "@/components/terra-flow/booking-modal"

// SSR-safe mounted state using useSyncExternalStore
const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const classSchedule = {
  Mon: [
    { time: "6:30 AM", name: "Morning Flow", instructor: "Maya", duration: "50 min", level: "All Levels" },
    { time: "9:00 AM", name: "Foundation Flow", instructor: "Sarah", duration: "50 min", level: "Beginner" },
    { time: "12:00 PM", name: "Express Reformer", instructor: "Elena", duration: "30 min", level: "All Levels" },
    { time: "5:30 PM", name: "Reformer Sculpt", instructor: "Maya", duration: "55 min", level: "Intermediate" },
    { time: "7:00 PM", name: "Evening Restore", instructor: "Sarah", duration: "50 min", level: "All Levels" },
  ],
  Tue: [
    { time: "7:00 AM", name: "Power Pilates", instructor: "Elena", duration: "45 min", level: "Advanced" },
    { time: "10:00 AM", name: "Gentle Movement", instructor: "Sarah", duration: "50 min", level: "Beginner" },
    { time: "12:30 PM", name: "Mat Fundamentals", instructor: "Maya", duration: "45 min", level: "Beginner" },
    { time: "6:00 PM", name: "Reformer Flow", instructor: "Elena", duration: "55 min", level: "Intermediate" },
  ],
  Wed: [
    { time: "6:30 AM", name: "Morning Flow", instructor: "Maya", duration: "50 min", level: "All Levels" },
    { time: "9:30 AM", name: "Reformer Sculpt", instructor: "Elena", duration: "55 min", level: "Intermediate" },
    { time: "12:00 PM", name: "Express Mat", instructor: "Sarah", duration: "30 min", level: "All Levels" },
    { time: "5:30 PM", name: "Power Pilates", instructor: "Maya", duration: "45 min", level: "Advanced" },
    { time: "7:00 PM", name: "Foundation Flow", instructor: "Sarah", duration: "50 min", level: "Beginner" },
  ],
  Thu: [
    { time: "7:00 AM", name: "Reformer Flow", instructor: "Elena", duration: "55 min", level: "Intermediate" },
    { time: "10:00 AM", name: "Prenatal Pilates", instructor: "Sarah", duration: "45 min", level: "All Levels" },
    { time: "12:30 PM", name: "Express Reformer", instructor: "Maya", duration: "30 min", level: "All Levels" },
    { time: "6:00 PM", name: "Mat Sculpt", instructor: "Elena", duration: "50 min", level: "Intermediate" },
  ],
  Fri: [
    { time: "6:30 AM", name: "Morning Flow", instructor: "Maya", duration: "50 min", level: "All Levels" },
    { time: "9:00 AM", name: "Foundation Flow", instructor: "Sarah", duration: "50 min", level: "Beginner" },
    { time: "12:00 PM", name: "Express Mat", instructor: "Elena", duration: "30 min", level: "All Levels" },
    { time: "5:00 PM", name: "Weekend Wind-Down", instructor: "Maya", duration: "55 min", level: "All Levels" },
  ],
  Sat: [
    { time: "8:00 AM", name: "Saturday Sculpt", instructor: "Maya", duration: "60 min", level: "All Levels" },
    { time: "9:30 AM", name: "Reformer Flow", instructor: "Elena", duration: "55 min", level: "Intermediate" },
    { time: "11:00 AM", name: "Foundation Flow", instructor: "Sarah", duration: "50 min", level: "Beginner" },
  ],
  Sun: [
    { time: "9:00 AM", name: "Sunday Slow Flow", instructor: "Sarah", duration: "60 min", level: "All Levels" },
    { time: "10:30 AM", name: "Reformer Restore", instructor: "Maya", duration: "55 min", level: "All Levels" },
  ],
}

const levelColors: Record<string, string> = {
  Beginner: "bg-accent/20 text-accent-foreground",
  Intermediate: "bg-primary/20 text-primary",
  Advanced: "bg-chart-1/20 text-chart-1",
  "All Levels": "bg-secondary text-secondary-foreground",
}

interface ClassDetails {
  time: string
  name: string
  instructor: string
  duration: string
  level: string
  day: string
  date: string
}

export function ScheduleCalendar() {
  const [selectedDay, setSelectedDay] = useState("Mon")
  const [currentWeek, setCurrentWeek] = useState(0)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassDetails | null>(null)
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const weekDates = useMemo(() => {
    if (!mounted) {
      // Return placeholder data during SSR
      return daysOfWeek.map((day) => ({
        day,
        date: 1,
        month: "Jan",
        fullDate: "",
        isToday: false,
      }))
    }

    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + currentWeek * 7)

    return daysOfWeek.map((day, index) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + index)
      return {
        day,
        date: date.getDate(),
        month: date.toLocaleDateString("en-US", { month: "short" }),
        fullDate: date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        isToday: date.toDateString() === today.toDateString(),
      }
    })
  }, [mounted, currentWeek])

  const handleBookClass = (cls: (typeof classSchedule)["Mon"][0]) => {
    const currentDayInfo = weekDates.find((d) => d.day === selectedDay)
    setSelectedClass({
      ...cls,
      day: selectedDay,
      date: currentDayInfo?.fullDate || "",
    })
    setIsBookingOpen(true)
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setCurrentWeek((prev) => prev - 1)}
            className="p-2 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-medium">
            {weekDates[0].month} {weekDates[0].date} - {weekDates[6].month} {weekDates[6].date}
          </h3>
          <button
            onClick={() => setCurrentWeek((prev) => prev + 1)}
            className="p-2 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day Selector */}
        <div className="grid grid-cols-7 gap-2 mb-12">
          {weekDates.map(({ day, date, isToday }) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`p-4 rounded-lg text-center transition-all ${
                selectedDay === day
                  ? "bg-primary text-primary-foreground"
                  : isToday
                    ? "bg-accent/20 border-2 border-primary"
                    : "bg-card hover:bg-secondary"
              }`}
            >
              <p className="text-xs uppercase tracking-wider mb-1">{day}</p>
              <p className="text-2xl font-light">{date}</p>
            </button>
          ))}
        </div>

        {/* Classes List */}
        <div className="space-y-4">
          <h4 className="text-sm uppercase tracking-widest text-muted-foreground mb-6">{selectedDay}&apos;s Classes</h4>
          {classSchedule[selectedDay as keyof typeof classSchedule].map((cls, index) => (
            <div
              key={index}
              className="bg-card rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-border hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-6">
                <div className="text-center min-w-[80px]">
                  <p className="text-xl font-light">{cls.time}</p>
                </div>
                <div>
                  <h5 className="text-xl font-medium mb-1">{cls.name}</h5>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {cls.instructor}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {cls.duration}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider ${levelColors[cls.level]}`}>
                  {cls.level}
                </span>
                <Button
                  onClick={() => handleBookClass(cls)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Book Now
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-12 p-6 bg-card rounded-lg">
          <h4 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Class Levels</h4>
          <div className="flex flex-wrap gap-4">
            {Object.entries(levelColors).map(([level, colors]) => (
              <span key={level} className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider ${colors}`}>
                {level}
              </span>
            ))}
          </div>
        </div>
      </div>

      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} classDetails={selectedClass} />
    </section>
  )
}
