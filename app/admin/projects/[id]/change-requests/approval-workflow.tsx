'use client'

import { Card, CardContent } from '@/components/ui/card'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount)
}

interface Props {
  totalRequests: number
  pendingCount: number
  signedAmount: number
  totalAmount: number
}

export function ApprovalWorkflow({
  totalRequests,
  pendingCount,
  signedAmount,
  totalAmount,
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{totalRequests}</div>
          <div className="text-sm text-muted-foreground">Total Requests</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{pendingCount}</div>
          <div className="text-sm text-muted-foreground">Awaiting Signature</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{formatCurrency(signedAmount)}</div>
          <div className="text-sm text-muted-foreground">Approved Value</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
          <div className="text-sm text-muted-foreground">Total Value</div>
        </CardContent>
      </Card>
    </div>
  )
}
