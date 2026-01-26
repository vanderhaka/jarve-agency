import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/navigation/breadcrumbs'
import { InvoiceDetail } from './invoice-detail'

interface Props {
  params: Promise<{ id: string }>
}

async function getInvoice(invoiceId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      client:clients(id, name, email, xero_contact_id),
      project:agency_projects(id, name),
      line_items:invoice_line_items(*),
      payments(*)
    `)
    .eq('id', invoiceId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching invoice:', error)
    return null
  }

  return data
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const invoice = await getInvoice(id)
  if (!invoice) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Breadcrumbs />
      <InvoiceDetail invoice={invoice} />
    </div>
  )
}
