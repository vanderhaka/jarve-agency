import { redirect } from 'next/navigation'
import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { getPortalManifest } from '@/lib/integrations/portal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface PaymentCancelPageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ invoice_id?: string }>
}

export default async function PaymentCancelPage({ params, searchParams }: PaymentCancelPageProps) {
  const { token } = await params
  const { invoice_id } = await searchParams

  // Validate portal token
  const manifestResult = await getPortalManifest(token)
  if (!manifestResult.success) {
    redirect('/revoked')
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-10 h-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was not processed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            No charges were made to your account.
            You can try again at any time from your invoices.
          </p>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href={`/portal/${token}?tab=invoices`}>
                Back to Invoices
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
