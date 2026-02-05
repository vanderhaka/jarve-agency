// Mock data for the profile dashboard demo

export const userData = {
  name: "Sarah Mitchell",
  email: "sarah.mitchell@email.com",
  memberSince: "January 2024",
  avatar: "/terra-flow/images/hero-woman.jpg",
}

export const stats = {
  totalClasses: 47,
  thisMonth: 8,
  streak: 12,
  favoriteClass: "Reformer Flow",
  favoriteInstructor: "Maya Chen",
}

export const currentPackage = {
  name: "Unlimited Monthly",
  type: "membership",
  status: "active",
  renewalDate: "December 15, 2025",
  price: 199,
  classesThisMonth: 8,
}

export const classPacks = [
  {
    id: 1,
    name: "10 Class Pack",
    remaining: 6,
    total: 10,
    expiresAt: "February 28, 2026",
    purchasedAt: "November 1, 2025",
  },
]

export const upcomingClasses = [
  {
    id: 1,
    name: "Foundation Pilates",
    instructor: "Maya Chen",
    date: "Nov 27, 2025",
    time: "9:00 AM",
    duration: "55 min",
  },
  {
    id: 2,
    name: "Reformer Flow",
    instructor: "Elena Rodriguez",
    date: "Nov 28, 2025",
    time: "10:30 AM",
    duration: "55 min",
  },
  {
    id: 3,
    name: "Power Sculpt",
    instructor: "Jordan Kim",
    date: "Nov 30, 2025",
    time: "8:00 AM",
    duration: "45 min",
  },
]

export const classHistory = [
  {
    id: 1,
    name: "Foundation Pilates",
    instructor: "Maya Chen",
    date: "Nov 25, 2025",
    status: "attended" as const,
  },
  {
    id: 2,
    name: "Reformer Flow",
    instructor: "Elena Rodriguez",
    date: "Nov 23, 2025",
    status: "attended" as const,
  },
  {
    id: 3,
    name: "Power Sculpt",
    instructor: "Jordan Kim",
    date: "Nov 21, 2025",
    status: "attended" as const,
  },
  {
    id: 4,
    name: "Mat Fundamentals",
    instructor: "Sarah Thompson",
    date: "Nov 19, 2025",
    status: "cancelled" as const,
  },
  {
    id: 5,
    name: "Reformer Flow",
    instructor: "Elena Rodriguez",
    date: "Nov 17, 2025",
    status: "attended" as const,
  },
]

export const achievements = [
  { id: 1, name: "First Class", description: "Completed your first class", earned: true, icon: "🌱" },
  { id: 2, name: "Week Warrior", description: "Attended 3 classes in one week", earned: true, icon: "⚡" },
  { id: 3, name: "Month Master", description: "Attended 10 classes in one month", earned: false, icon: "🏆" },
  { id: 4, name: "Streak Star", description: "Maintained a 30-day streak", earned: false, icon: "🔥" },
]

export const purchaseHistory = [
  { date: "Nov 15, 2025", item: "Unlimited Monthly", amount: "$199.00", status: "Paid" },
  { date: "Nov 1, 2025", item: "10 Class Pack", amount: "$280.00", status: "Paid" },
  { date: "Oct 15, 2025", item: "Unlimited Monthly", amount: "$199.00", status: "Paid" },
  { date: "Sep 15, 2025", item: "Unlimited Monthly", amount: "$199.00", status: "Paid" },
]
