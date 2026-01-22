import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

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

  const searchTerm = `%${query}%`

  try {
    // Search across all tables in parallel
    const [leadsData, clientsData, projectsData, employeesData] = await Promise.all([
      // Search leads
      supabase
        .from('leads')
        .select('id, name, email, status')
        .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(5),

      // Search clients
      supabase
        .from('clients')
        .select('id, name, email, company')
        .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},company.ilike.${searchTerm}`)
        .limit(5),

      // Search projects
      supabase
        .from('agency_projects')
        .select('id, name, type, status')
        .ilike('name', searchTerm)
        .limit(5),

      // Search employees
      supabase
        .from('employees')
        .select('id, name, email, role')
        .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
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
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
