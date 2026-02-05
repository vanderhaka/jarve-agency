"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/terra-flow/ui/button"
import { Card, CardContent } from "@/components/terra-flow/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/terra-flow/ui/tabs"
import { Calendar, TrendingUp, Flame, Award, Settings } from "lucide-react"
import { userData, stats } from "./profile-dashboard-data"
import { ProfileOverviewTab } from "./profile-overview-tab"
import { ProfilePackagesTab } from "./profile-packages-tab"
import { ProfileHistoryTab } from "./profile-history-tab"
import { ProfileAchievementsTab } from "./profile-achievements-tab"

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

          <TabsContent value="overview">
            <ProfileOverviewTab />
          </TabsContent>

          <TabsContent value="packages">
            <ProfilePackagesTab />
          </TabsContent>

          <TabsContent value="history">
            <ProfileHistoryTab />
          </TabsContent>

          <TabsContent value="achievements">
            <ProfileAchievementsTab />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
