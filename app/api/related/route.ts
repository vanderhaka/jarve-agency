import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

type EntityType = 'lead' | 'client' | 'project' | 'employee' | 'proposal'

interface RelatedItem {
  id: string
  name: string
  type: EntityType
  subtitle?: string
  href: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as EntityType | null
  const id = searchParams.get('id')

  if (!type || !id) {
    return NextResponse.json({ items: [] })
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ items: [] })
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const items: RelatedItem[] = []

  try {
    switch (type) {
      case 'lead': {
        // For leads: find if converted to client, any related proposals
        const { data: lead } = await supabase
          .from('leads')
          .select('converted_client_id, email')
          .eq('id', id)
          .is('deleted_at', null)
          .single()

        if (lead?.converted_client_id) {
          const { data: client } = await supabase
            .from('clients')
            .select('id, name, company')
            .eq('id', lead.converted_client_id)
            .single()

          if (client) {
            items.push({
              id: client.id,
              name: client.name,
              type: 'client',
              subtitle: client.company,
              href: `/app/clients/${client.id}`,
            })
          }
        }
        break
      }

      case 'client': {
        // For clients: find their projects and proposals
        const { data: projects } = await supabase
          .from('agency_projects')
          .select('id, name, status')
          .eq('client_id', id)
          .is('deleted_at', null)
          .limit(5)

        if (projects) {
          for (const project of projects) {
            items.push({
              id: project.id,
              name: project.name,
              type: 'project',
              subtitle: project.status,
              href: `/app/projects/${project.id}`,
            })
          }
        }

        const { data: proposals } = await supabase
          .from('proposals')
          .select('id, title, status')
          .eq('client_id', id)
          .limit(5)

        if (proposals) {
          for (const proposal of proposals) {
            items.push({
              id: proposal.id,
              name: proposal.title,
              type: 'proposal',
              subtitle: proposal.status,
              href: `/admin/proposals/${proposal.id}`,
            })
          }
        }
        break
      }

      case 'project': {
        // For projects: find the client, team members, related proposals
        const { data: project } = await supabase
          .from('agency_projects')
          .select('client_id, lead_id, clients(id, name, company)')
          .eq('id', id)
          .is('deleted_at', null)
          .single()

        if (project?.clients) {
          const client = Array.isArray(project.clients) ? project.clients[0] : project.clients
          if (client) {
            items.push({
              id: client.id,
              name: client.name,
              type: 'client',
              subtitle: client.company,
              href: `/app/clients/${client.id}`,
            })
          }
        }

        // Get project lead employee
        if (project?.lead_id) {
          const { data: lead } = await supabase
            .from('employees')
            .select('id, name, role')
            .eq('id', project.lead_id)
            .single()

          if (lead) {
            items.push({
              id: lead.id,
              name: lead.name,
              type: 'employee',
              subtitle: lead.role ? `Project Lead - ${lead.role}` : 'Project Lead',
              href: `/admin/employees/${lead.id}`,
            })
          }
        }
        break
      }

      case 'employee': {
        // For employees: find their assigned projects
        const { data: projects } = await supabase
          .from('agency_projects')
          .select('id, name, status')
          .eq('lead_id', id)
          .is('deleted_at', null)
          .limit(5)

        if (projects) {
          for (const project of projects) {
            items.push({
              id: project.id,
              name: project.name,
              type: 'project',
              subtitle: project.status ? `Lead - ${project.status}` : 'Lead',
              href: `/app/projects/${project.id}`,
            })
          }
        }
        break
      }

      case 'proposal': {
        // For proposals: find the client and related project
        const { data: proposal } = await supabase
          .from('proposals')
          .select('client_id, project_id, clients(id, name, company), agency_projects(id, name)')
          .eq('id', id)
          .single()

        if (proposal?.clients) {
          const client = Array.isArray(proposal.clients) ? proposal.clients[0] : proposal.clients
          if (client) {
            items.push({
              id: client.id,
              name: client.name,
              type: 'client',
              subtitle: client.company,
              href: `/app/clients/${client.id}`,
            })
          }
        }

        if (proposal?.agency_projects) {
          const project = Array.isArray(proposal.agency_projects) ? proposal.agency_projects[0] : proposal.agency_projects
          if (project) {
            items.push({
              id: project.id,
              name: project.name,
              type: 'project',
              subtitle: 'Related project',
              href: `/app/projects/${project.id}`,
            })
          }
        }
        break
      }
    }
  } catch (error) {
    console.error('Error fetching related items:', error)
    return NextResponse.json({ items: [] })
  }

  return NextResponse.json({ items })
}
