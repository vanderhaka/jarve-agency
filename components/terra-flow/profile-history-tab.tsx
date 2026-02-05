"use client"

import { Button } from "@/components/terra-flow/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/terra-flow/ui/card"
import { ChevronRight, CheckCircle, XCircle } from "lucide-react"
import { classHistory, stats } from "./profile-dashboard-data"

export function ProfileHistoryTab() {
  return (
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
  )
}
