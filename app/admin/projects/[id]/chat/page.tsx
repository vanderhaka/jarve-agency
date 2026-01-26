import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/navigation/breadcrumbs'
import { AdminChatInterface } from './admin-chat-interface'

interface Props {
  params: Promise<{ id: string }>
}

async function getProject(projectId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agency_projects')
    .select(`
      *,
      clients (
        id,
        name,
        email
      )
    `)
    .eq('id', projectId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching project:', error)
    return null
  }

  return data
}

async function getMessages(projectId: string) {
  const supabase = await createClient()
  console.log('[AdminChat] Fetching messages for project:', projectId)
  
  // Check if user is in employees table for debugging
  const { data: { user } } = await supabase.auth.getUser()
  console.log('[AdminChat] Current user:', user?.id, user?.email)
  
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, deleted_at')
    .eq('id', user?.id)
    .single()
  console.log('[AdminChat] Employee record:', employee, 'Error:', empError)
  
  // Debug: Count all messages in the table
  const { count: totalCount, error: countErr } = await supabase
    .from('portal_messages')
    .select('*', { count: 'exact', head: true })
  console.log('[AdminChat] Total messages in table:', totalCount, 'Error:', countErr)
  
  const { data, error } = await supabase
    .from('portal_messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[AdminChat] Error fetching messages:', error)
    return []
  }

  console.log('[AdminChat] Messages found for this project:', data?.length || 0, data)
  return data || []
}

async function getClientUser(clientId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('client_users')
    .select('id, name, email')
    .eq('client_id', clientId)
    .limit(1)
    .single()

  return data
}

export default async function ProjectChatPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const project = await getProject(id)
  if (!project) {
    notFound()
  }

  const messages = await getMessages(id)
  const clientUser = project.clients?.id ? await getClientUser(project.clients.id) : null

  return (
    <div className="flex flex-col gap-6 p-6">
      <Breadcrumbs />
      <AdminChatInterface
        projectId={id}
        projectName={project.name}
        clientName={project.clients?.name || 'Unknown Client'}
        clientUserName={clientUser?.name || null}
        currentUserId={user.id}
        initialMessages={messages}
      />
    </div>
  )
}
