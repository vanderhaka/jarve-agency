import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { getCheckoutSession } from '@/lib/integrations/stripe/client'
import { getPortalManifest } from '@/lib/integrations/portal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface PaymentSuccessPageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ session_id?: string }>
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100) // Stripe amounts are in cents
}

export default async function PaymentSuccessPage({ params, searchParams }: PaymentSuccessPageProps) {
  const { token } = await params
  const { session_id } = await searchParams

  // Validate portal token
  const manifestResult = await getPortalManifest(token)
  if (!manifestResult.success) {
    redirect('/revoked')
  }

  // Retrieve checkout session for payment details
  let paymentDetails: {
    amount: number
    currency: string
    invoiceNumber: string | null
  } | null = null

  if (session_id) {
    const session = await getCheckoutSession(session_id)
    // Verify session belongs to this portal token and is paid
    if (session && session.payment_status === 'paid' && session.metadata?.portal_token === token) {
      paymentDetails = {
        amount: session.amount_total ?? 0,
        currency: session.currency ?? 'aud',
        invoiceNumber: session.metadata?.invoice_number || null,
      }
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Payment Successful</CardTitle>
          <CardDescription>
            Thank you for your payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentDetails && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              {paymentDetails.invoiceNumber && (
                <div className="text-sm text-muted-foreground">
                  Invoice: <span className="font-medium text-foreground">{paymentDetails.invoiceNumber}</span>
                </div>
              )}
              <div className="text-2xl font-bold">
                {formatCurrency(paymentDetails.amount, paymentDetails.currency)}
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            A confirmation email will be sent to you shortly.
            Your invoice status will be updated automatically.
          </p>

          <Button asChild className="w-full">
            <Link href={`/portal/${token}?tab=invoices`}>
              View Invoices
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
