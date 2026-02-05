"use client"

import Link from "next/link"
import { Button } from "@/components/terra-flow/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/terra-flow/ui/card"
import { Clock, Flame, Award, Package, CreditCard } from "lucide-react"
import { upcomingClasses, currentPackage, classPacks, stats } from "./profile-dashboard-data"

export function ProfileOverviewTab() {
  return (
    <div className="space-y-8">
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
    </div>
  )
}
