import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// Escape LIKE special characters to prevent pattern injection
function escapeLikePattern(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&')
}

// Check if string looks like a UUID (full or partial)
function isUuidFragment(str: string): boolean {
  // Match full UUID or partial UUID fragments (at least 4 hex chars)
  return /^[0-9a-f]{4,}(?:-[0-9a-f]*)*$/i.test(str)
}

interface IdSearchResult {
  id: string
  name: string
  subtitle: string
  type: 'lead' | 'client' | 'project' | 'employee'
  href: string
}

// Search by ID across all entity tables
async function searchById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  idFragment: string,
  isAdmin: boolean
): Promise<IdSearchResult[]> {
  // For partial UUIDs, use LIKE; for full UUIDs, use exact match
  const isFullUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idFragment)

  const results: IdSearchResult[] = []

  // Search leads
  const leadQuery = supabase
    .from('leads')
    .select('id, name, email, status')
    .is('deleted_at', null)

  if (isFullUuid) {
    leadQuery.eq('id', idFragment)
  } else {
    leadQuery.ilike('id', `${idFragment}%`)
  }

  const { data: leads } = await leadQuery.limit(3)
  if (leads) {
    for (const lead of leads) {
      results.push({
        id: lead.id,
        name: lead.name,
        subtitle: lead.email,
        type: 'lead',
        href: `/app/leads/${lead.id}`,
      })
    }
  }

  // Search clients
  const clientQuery = supabase
    .from('clients')
    .select('id, name, email, company')
    .is('deleted_at', null)

  if (isFullUuid) {
    clientQuery.eq('id', idFragment)
  } else {
    clientQuery.ilike('id', `${idFragment}%`)
  }

  const { data: clients } = await clientQuery.limit(3)
  if (clients) {
    for (const client of clients) {
      results.push({
        id: client.id,
        name: client.name,
        subtitle: client.company ? client.company : client.email,
        type: 'client',
        href: `/app/clients/${client.id}`,
      })
    }
  }

  // Search projects
  const projectQuery = supabase
    .from('agency_projects')
    .select('id, name, type, status')
    .is('deleted_at', null)

  if (isFullUuid) {
    projectQuery.eq('id', idFragment)
  } else {
    projectQuery.ilike('id', `${idFragment}%`)
  }

  const { data: projects } = await projectQuery.limit(3)
  if (projects) {
    for (const project of projects) {
      results.push({
        id: project.id,
        name: project.name,
        subtitle: project.type,
        type: 'project',
        href: `/app/projects/${project.id}`,
      })
    }
  }

  // Search employees (admin only)
  if (isAdmin) {
    const employeeQuery = supabase
      .from('employees')
      .select('id, name, email, role')
      .is('deleted_at', null)

    if (isFullUuid) {
      employeeQuery.eq('id', idFragment)
    } else {
      employeeQuery.ilike('id', `${idFragment}%`)
    }

    const { data: employees } = await employeeQuery.limit(3)
    if (employees) {
      for (const employee of employees) {
        results.push({
          id: employee.id,
          name: employee.name,
          subtitle: employee.role ? employee.role : employee.email,
          type: 'employee',
          href: `/admin/employees/${employee.id}`,
        })
      }
    }
  }

  return results
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

  // Check if user is admin for employee search
  const { data: currentEmployee } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = currentEmployee?.role === 'admin'

  const trimmedQuery = query.trim()

  // Check for # prefix for ID search
  if (trimmedQuery.startsWith('#')) {
    const idFragment = trimmedQuery.slice(1).trim()
    if (idFragment.length >= 4 && isUuidFragment(idFragment)) {
      try {
        const results = await searchById(supabase, idFragment, isAdmin)
        return NextResponse.json({ results, searchMode: 'id' })
      } catch (error) {
        console.error('ID search error:', error)
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
      }
    }
    // Invalid ID format, return empty
    return NextResponse.json({ results: [], searchMode: 'id' })
  }

  // Escape special characters and create search term
  const escapedQuery = escapeLikePattern(trimmedQuery)
  const searchTerm = `%${escapedQuery}%`

  try {
    // Search across tables in parallel (exclude soft-deleted records)
    const [leadsData, clientsData, projectsData, employeesData, milestonesData, changeRequestsData] = await Promise.all([
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

      // Search milestones
      supabase
        .from('milestones')
        .select('id, title, project_id, status, amount, agency_projects(name)')
        .ilike('title', searchTerm)
        .limit(5),

      // Search change requests
      supabase
        .from('change_requests')
        .select('id, title, project_id, status, amount, agency_projects(name)')
        .ilike('title', searchTerm)
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
      ...(milestonesData.data || []).map((milestone) => {
        const project = Array.isArray(milestone.agency_projects) ? milestone.agency_projects[0] : milestone.agency_projects
        const projectName = project?.name
        return {
          id: milestone.id,
          name: milestone.title,
          subtitle: projectName ? `${projectName} - $${milestone.amount}` : `$${milestone.amount}`,
          type: 'milestone' as const,
          href: `/admin/projects/${milestone.project_id}?tab=milestones`,
        }
      }),
      ...(changeRequestsData.data || []).map((cr) => {
        const project = Array.isArray(cr.agency_projects) ? cr.agency_projects[0] : cr.agency_projects
        const projectName = project?.name
        return {
          id: cr.id,
          name: cr.title,
          subtitle: projectName ? `${projectName} - $${cr.amount}` : `$${cr.amount}`,
          type: 'change_request' as const,
          href: `/admin/projects/${cr.project_id}?tab=change-requests`,
        }
      }),
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
