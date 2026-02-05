"use client"

import Link from "next/link"
import { Button } from "@/components/terra-flow/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/terra-flow/ui/card"
import { currentPackage, classPacks, purchaseHistory } from "./profile-dashboard-data"

export function ProfilePackagesTab() {
  return (
    <div className="space-y-6">
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
            {purchaseHistory.map((purchase, idx) => (
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
    </div>
  )
}
