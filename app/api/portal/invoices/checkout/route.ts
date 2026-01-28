/**
 * Portal Invoice Checkout API
 * Creates a Stripe Checkout session for invoice payment
 *
 * POST /api/portal/invoices/checkout
 * Body: { token: string, invoiceId: string }
 * Returns: { checkout_url: string } or { error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPortalCheckoutSession } from '@/lib/integrations/portal'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, invoiceId } = body

    // Validate required fields
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid token' },
        { status: 400 }
      )
    }

    if (!invoiceId || typeof invoiceId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid invoiceId' },
        { status: 400 }
      )
    }

    // Create checkout session using server action
    const result = await createPortalCheckoutSession(token, invoiceId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      checkout_url: result.checkout_url,
    })
  } catch (error) {
    console.error('Error in portal checkout API:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
