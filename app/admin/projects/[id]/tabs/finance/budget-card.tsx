import { Card, CardContent } from '@/components/ui/card'

interface Invoice {
  id: string
  invoiceNumber: string | null
  xeroStatus: string | null
  total: number | null
  currency: string
  issueDate: string | null
  dueDate: string | null
  paidAt: string | null
  client?: {
    id: string
    name: string
  }
}

interface BudgetCardProps {
  invoices: Invoice[]
}

export function BudgetCard({ invoices }: BudgetCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{invoices.length}</div>
          <div className="text-sm text-muted-foreground">Total Invoices</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-green-600">
            {invoices.filter((i) => i.xeroStatus === 'PAID').length}
          </div>
          <div className="text-sm text-muted-foreground">Paid</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-yellow-600">
            {invoices.filter((i) => i.xeroStatus === 'AUTHORISED').length}
          </div>
          <div className="text-sm text-muted-foreground">Pending Payment</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">
            ${invoices
              .filter((i) => i.xeroStatus === 'PAID')
              .reduce((sum, i) => sum + (i.total || 0), 0)
              .toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Total Received</div>
        </CardContent>
      </Card>
    </div>
  )
}
