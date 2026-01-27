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

      // Search change requests (exclude archived)
      supabase
        .from('change_requests')
        .select('id, title, project_id, status, amount, agency_projects(name)')
        .neq('status', 'archived')
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
