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
    // Search across tables in parallel
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

      // Search employees (only if admin, otherwise return empty)
      isAdmin
        ? supabase
            .from('employees')
            .select('id, name, email, role')
            .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
            .limit(5)
        : Promise.resolve({ data: [], error: null }),
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
