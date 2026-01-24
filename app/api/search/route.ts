import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// Escape LIKE special characters to prevent pattern injection
function escapeLikePattern(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&')
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] })
  }

  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Escape special characters and create search term
  const escapedQuery = escapeLikePattern(query.trim())
  const searchTerm = `%${escapedQuery}%`

  // Check if user is admin for employee search
  const { data: currentEmployee } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = currentEmployee?.role === 'admin'

  try {
    // Search across tables in parallel (exclude soft-deleted records)
    const [leadsData, clientsData, projectsData, employeesData, proposalsData, contractDocsData, invoicesData] = await Promise.all([
      // Search leads (exclude deleted)
      supabase
        .from('leads')
        .select('id, name, email, status')
        .is('deleted_at', null)
        .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(5),

      // Search clients (exclude deleted)
      supabase
        .from('clients')
        .select('id, name, email, company')
        .is('deleted_at', null)
        .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},company.ilike.${searchTerm}`)
        .limit(5),

      // Search projects (exclude deleted)
      supabase
        .from('agency_projects')
        .select('id, name, type, status')
        .is('deleted_at', null)
        .ilike('name', searchTerm)
        .limit(5),

      // Search employees (only if admin, exclude deleted)
      isAdmin
        ? supabase
            .from('employees')
            .select('id, name, email, role')
            .is('deleted_at', null)
            .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
            .limit(5)
        : Promise.resolve({ data: [], error: null }),

      // Search proposals
      supabase
        .from('proposals')
        .select('id, title, status, client:clients(name)')
        .is('archived_at', null)
        .ilike('title', searchTerm)
        .limit(5),

      // Search contract docs
      supabase
        .from('contract_docs')
        .select('id, title, doc_type, client:clients(name)')
        .ilike('title', searchTerm)
        .limit(5),

      // Search invoices by invoice number
      supabase
        .from('invoices')
        .select('id, invoice_number, total, xero_status, client:clients(name)')
        .ilike('invoice_number', searchTerm)
        .limit(5),
    ])

    // Format results
    const results = [
      ...(leadsData.data || []).map(lead => ({
        id: lead.id,
        name: lead.name,
        subtitle: lead.email,
        type: 'lead' as const,
        href: `/app/leads/${lead.id}`,
      })),
      ...(clientsData.data || []).map(client => ({
        id: client.id,
        name: client.name,
        subtitle: client.company || client.email,
        type: 'client' as const,
        href: `/app/clients/${client.id}`,
      })),
      ...(projectsData.data || []).map(project => ({
        id: project.id,
        name: project.name,
        subtitle: project.type,
        type: 'project' as const,
        href: `/app/projects/${project.id}`,
      })),
      ...(employeesData.data || []).map(employee => ({
        id: employee.id,
        name: employee.name,
        subtitle: employee.role || employee.email,
        type: 'employee' as const,
        href: `/admin/employees/${employee.id}`,
      })),
      ...(proposalsData.data || []).map((proposal) => {
        const client = Array.isArray(proposal.client) ? proposal.client[0] : proposal.client
        return {
          id: proposal.id,
          name: proposal.title,
          subtitle: client?.name || proposal.status,
          type: 'proposal' as const,
          href: `/admin/proposals/${proposal.id}`,
        }
      }),
      ...(contractDocsData.data || []).map((doc) => {
        const client = Array.isArray(doc.client) ? doc.client[0] : doc.client
        return {
          id: doc.id,
          name: doc.title,
          subtitle: client?.name || doc.doc_type,
          type: 'contract' as const,
          href: `/admin/proposals`,
        }
      }),
      ...(invoicesData.data || []).map(invoice => {
        const clientData = invoice.client
        const client = Array.isArray(clientData) ? clientData[0] : clientData
        return {
          id: invoice.id,
          name: invoice.invoice_number || 'Draft Invoice',
          subtitle: client?.name || `$${invoice.total?.toFixed(2) || '0.00'}`,
          type: 'invoice' as const,
          href: `/admin/invoices/${invoice.id}`,
        }
      }),
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
