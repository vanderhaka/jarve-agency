"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/terra-flow/ui/card"
import { CheckCircle } from "lucide-react"
import { achievements } from "./profile-dashboard-data"

export function ProfileAchievementsTab() {
  return (
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
  )
}
