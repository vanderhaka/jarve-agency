"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/terra-flow/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/terra-flow/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/terra-flow/ui/tabs"
import {
  Calendar,
  Clock,
  Flame,
  Award,
  TrendingUp,
  Package,
  CreditCard,
  Settings,
  ChevronRight,
  CheckCircle,
  XCircle,
} from "lucide-react"

// Mock user data
const userData = {
  name: "Sarah Mitchell",
  email: "sarah.mitchell@email.com",
  memberSince: "January 2024",
  avatar: "/terra-flow/images/hero-woman.jpg",
}

const stats = {
  totalClasses: 47,
  thisMonth: 8,
  streak: 12,
  favoriteClass: "Reformer Flow",
  favoriteInstructor: "Maya Chen",
}

const currentPackage = {
  name: "Unlimited Monthly",
  type: "membership",
  status: "active",
  renewalDate: "December 15, 2025",
  price: 199,
  classesThisMonth: 8,
}

const classPacks = [
  {
    id: 1,
    name: "10 Class Pack",
    remaining: 6,
    total: 10,
    expiresAt: "February 28, 2026",
    purchasedAt: "November 1, 2025",
  },
]

const upcomingClasses = [
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

const classHistory = [
  {
    id: 1,
    name: "Foundation Pilates",
    instructor: "Maya Chen",
    date: "Nov 25, 2025",
    status: "attended",
  },
  {
    id: 2,
    name: "Reformer Flow",
    instructor: "Elena Rodriguez",
    date: "Nov 23, 2025",
    status: "attended",
  },
  {
    id: 3,
    name: "Power Sculpt",
    instructor: "Jordan Kim",
    date: "Nov 21, 2025",
    status: "attended",
  },
  {
    id: 4,
    name: "Mat Fundamentals",
    instructor: "Sarah Thompson",
    date: "Nov 19, 2025",
    status: "cancelled",
  },
  {
    id: 5,
    name: "Reformer Flow",
    instructor: "Elena Rodriguez",
    date: "Nov 17, 2025",
    status: "attended",
  },
]

const achievements = [
  { id: 1, name: "First Class", description: "Completed your first class", earned: true, icon: "🌱" },
  { id: 2, name: "Week Warrior", description: "Attended 3 classes in one week", earned: true, icon: "⚡" },
  { id: 3, name: "Month Master", description: "Attended 10 classes in one month", earned: false, icon: "🏆" },
  { id: 4, name: "Streak Star", description: "Maintained a 30-day streak", earned: false, icon: "🔥" },
]

export function ProfileDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <section className="pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 p-6 bg-card rounded-lg border border-border">
          <div className="relative w-24 h-24 rounded-full overflow-hidden">
            <Image src={userData.avatar || "/placeholder.svg"} alt={userData.name} fill className="object-cover" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-foreground">{userData.name}</h2>
            <p className="text-muted-foreground">{userData.email}</p>
            <p className="text-sm text-muted-foreground mt-1">Member since {userData.memberSince}</p>
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Settings size={16} />
            Edit Profile
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{stats.totalClasses}</p>
                  <p className="text-sm text-muted-foreground">Total Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{stats.thisMonth}</p>
                  <p className="text-sm text-muted-foreground">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{stats.streak}</p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">2</p>
                  <p className="text-sm text-muted-foreground">Achievements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-secondary/50 p-1 mb-8">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background">
              Overview
            </TabsTrigger>
            <TabsTrigger value="packages" className="data-[state=active]:bg-background">
              My Packages
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-background">
              Class History
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-background">
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Upcoming Classes */}
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Upcoming Classes</CardTitle>
                  <Link href="/projects/terra-flow/schedule" className="text-sm text-primary hover:underline">
                    View All
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingClasses.map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{cls.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {cls.instructor} • {cls.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{cls.time}</p>
                        <p className="text-xs text-muted-foreground">{cls.duration}</p>
                      </div>
                    </div>
                  ))}
                  <Link href="/projects/terra-flow/schedule">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Book Another Class
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Current Package */}
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Current Package</CardTitle>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs uppercase tracking-wider rounded-full">
                    Active
                  </span>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xl font-semibold text-foreground">{currentPackage.name}</p>
                        <p className="text-sm text-muted-foreground">Renews {currentPackage.renewalDate}</p>
                      </div>
                      <p className="text-2xl font-semibold text-primary">
                        ${currentPackage.price}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock size={14} />
                      <span>{currentPackage.classesThisMonth} classes taken this month</span>
                    </div>
                  </div>

                  {classPacks.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-3">Class Packs</p>
                      {classPacks.map((pack) => (
                        <div key={pack.id} className="p-4 bg-secondary/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-foreground">{pack.name}</p>
                            <p className="text-primary font-semibold">
                              {pack.remaining}/{pack.total} remaining
                            </p>
                          </div>
                          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${(pack.remaining / pack.total) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">Expires {pack.expiresAt}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Link href="/projects/terra-flow/packages" className="flex-1">
                      <Button variant="outline" className="w-full gap-2 bg-transparent">
                        <Package size={16} />
                        View Packages
                      </Button>
                    </Link>
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <CreditCard size={16} />
                      Billing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Favorites */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Your Favorites</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Flame className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Favorite Class</p>
                      <p className="font-medium text-foreground">{stats.favoriteClass}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Award className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Favorite Instructor</p>
                      <p className="font-medium text-foreground">{stats.favoriteInstructor}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Active Membership</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-semibold text-foreground">{currentPackage.name}</h3>
                        <span className="px-3 py-1 bg-primary text-primary-foreground text-xs uppercase tracking-wider rounded-full">
                          Active
                        </span>
                      </div>
                      <p className="text-muted-foreground">Unlimited access to all classes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-semibold text-primary">
                        ${currentPackage.price}
                        <span className="text-base font-normal text-muted-foreground">/month</span>
                      </p>
                      <p className="text-sm text-muted-foreground">Next billing: {currentPackage.renewalDate}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline">Change Plan</Button>
                    <Button variant="outline">Update Payment</Button>
                    <Button
                      variant="outline"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10 bg-transparent"
                    >
                      Cancel Membership
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Class Packs</CardTitle>
                <Link href="/projects/terra-flow/packages">
                  <Button variant="outline" size="sm">
                    Buy More
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {classPacks.map((pack) => (
                  <div key={pack.id} className="p-6 bg-secondary/30 rounded-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                        <h4 className="text-xl font-semibold text-foreground">{pack.name}</h4>
                        <p className="text-sm text-muted-foreground">Purchased {pack.purchasedAt}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold text-primary">
                          {pack.remaining}
                          <span className="text-base font-normal text-muted-foreground">/{pack.total} classes</span>
                        </p>
                        <p className="text-sm text-muted-foreground">Expires {pack.expiresAt}</p>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(pack.remaining / pack.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Purchase History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: "Nov 15, 2025", item: "Unlimited Monthly", amount: "$199.00", status: "Paid" },
                    { date: "Nov 1, 2025", item: "10 Class Pack", amount: "$280.00", status: "Paid" },
                    { date: "Oct 15, 2025", item: "Unlimited Monthly", amount: "$199.00", status: "Paid" },
                    { date: "Sep 15, 2025", item: "Unlimited Monthly", amount: "$199.00", status: "Paid" },
                  ].map((purchase, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{purchase.item}</p>
                        <p className="text-sm text-muted-foreground">{purchase.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">{purchase.amount}</p>
                        <p className="text-sm text-primary">{purchase.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Class History</CardTitle>
                <p className="text-sm text-muted-foreground">{stats.totalClasses} total classes</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {classHistory.map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                      <div className="flex items-center gap-4">
                        {cls.status === "attended" ? (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                        <div>
                          <p className="font-medium text-foreground">{cls.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {cls.instructor} • {cls.date}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs uppercase tracking-wider rounded-full ${
                          cls.status === "attended"
                            ? "bg-primary/10 text-primary"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {cls.status}
                      </span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-6 gap-2 bg-transparent">
                  Load More
                  <ChevronRight size={16} />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Your Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-6 rounded-lg border ${
                        achievement.earned
                          ? "bg-primary/5 border-primary/20"
                          : "bg-secondary/20 border-border opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                            achievement.earned ? "bg-primary/10" : "bg-secondary"
                          }`}
                        >
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">{achievement.name}</h4>
                            {achievement.earned && <CheckCircle className="w-4 h-4 text-primary" />}
                          </div>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          {!achievement.earned && (
                            <p className="text-xs text-muted-foreground mt-2">Keep going to unlock!</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
