/**
 * Xero Payment Helpers
 * Shared functions for posting payments to Xero
 */

import { xeroApiCall } from './client'

/**
 * Post a payment to Xero
 */
export async function postPaymentToXero(
  xeroInvoiceId: string,
  amount: number,
  paymentDate: string,
  reference: string
): Promise<boolean> {
  try {
    // Get the first active bank account
    const accountsResult = await xeroApiCall<{
      Accounts: Array<{ AccountID: string; Name: string; Type: string; Status: string }>
    }>('/Accounts?where=Type=="BANK"&&Status=="ACTIVE"')

    if (!accountsResult.success || !accountsResult.data?.Accounts?.length) {
      console.warn('No active bank account found in Xero')
      return false
    }

    const bankAccount = accountsResult.data.Accounts[0]

    // Post the payment
    const paymentResult = await xeroApiCall('/Payments', {
      method: 'POST',
      body: {
        Payments: [
          {
            Invoice: { InvoiceID: xeroInvoiceId },
            Account: { AccountID: bankAccount.AccountID },
            Amount: amount,
            Date: paymentDate,
            Reference: reference,
          },
        ],
      },
    })

    if (!paymentResult.success) {
      console.error('Failed to post payment to Xero', { error: paymentResult.error })
      return false
    }

    console.info('Payment posted to Xero', { xeroInvoiceId, amount })
    return true
  } catch (error) {
    console.error('Error posting payment to Xero', { error })
    return false
  }
}
