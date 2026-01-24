/**
 * Lead conversion business logic - extracted for testability
 */

export interface Lead {
  id: string
  name: string | null
  email: string | null
  company: string | null
  message: string | null
  status: string
  converted_at: string | null
  archived_at: string | null
}

export interface Client {
  id: string
  name: string
}

export interface ConvertLeadInput {
  projectName: string
  projectType: 'web' | 'mobile' | 'branding' | 'marketing' | 'other'
  projectStatus: 'planning' | 'in_progress' | 'review' | 'completed'
  assignedTo?: string | null
}

export interface ConvertLeadResult {
  success: boolean
  message: string
  clientId?: string
  projectId?: string
  linkedExisting?: boolean
}

// Client interface for dependency injection
export interface LeadConversionClient {
  getLead: (leadId: string) => Promise<{ data: Lead | null; error: { message: string } | null }>
  findClientByEmail: (email: string) => Promise<{ data: Client | null; error: { message: string } | null }>
  createClient: (data: { name: string; email: string; company: string | null }) => Promise<{ data: { id: string } | null; error: { message: string } | null }>
  createClientUser: (data: { client_id: string; name: string; email: string }) => Promise<{ error: { message: string } | null }>
  createProject: (data: { name: string; type: string; status: string; client_id: string; assigned_to: string | null; description: string | null }) => Promise<{ data: { id: string } | null; error: { message: string } | null }>
  updateLead: (leadId: string, data: { status: string; client_id: string; project_id: string; converted_at: string; archived_at: string; archived_by: string }) => Promise<{ error: { message: string } | null }>
  archiveLead: (leadId: string, archivedBy: string) => Promise<{ error: { message: string } | null }>
  restoreLead: (leadId: string) => Promise<{ error: { message: string } | null }>
}

/**
 * Validates that a lead can be converted
 */
export function validateLeadForConversion(lead: Lead | null): { valid: true } | { valid: false; message: string } {
  if (!lead) {
    return { valid: false, message: 'Lead not found' }
  }

  if (!lead.name || !lead.name.trim()) {
    return { valid: false, message: 'Lead must have a name to convert' }
  }

  if (!lead.email || !lead.email.trim()) {
    return { valid: false, message: 'Lead must have an email to convert' }
  }

  if (lead.converted_at) {
    return { valid: false, message: 'This lead has already been converted' }
  }

  return { valid: true }
}

/**
 * Normalizes email for case-insensitive comparison
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * Performs the lead to project conversion
 */
export async function performLeadConversion(
  client: LeadConversionClient,
  leadId: string,
  input: ConvertLeadInput,
  employeeId: string
): Promise<ConvertLeadResult> {
  // Step 1: Fetch the lead
  const { data: lead, error: leadError } = await client.getLead(leadId)

  if (leadError) {
    return { success: false, message: 'Failed to fetch lead' }
  }

  // Step 2: Validate lead
  const validation = validateLeadForConversion(lead)
  if (!validation.valid) {
    return { success: false, message: validation.message }
  }

  // TypeScript now knows lead is not null and has required fields
  const leadEmail = normalizeEmail(lead!.email!)
  const now = new Date().toISOString()

  // Step 3: Find existing client by email (case-insensitive)
  const { data: existingClient } = await client.findClientByEmail(leadEmail)

  let clientId: string
  let linkedExisting = false

  if (existingClient) {
    // Use existing client
    clientId = existingClient.id
    linkedExisting = true
  } else {
    // Step 4: Create new client
    const { data: newClient, error: clientError } = await client.createClient({
      name: lead!.name!,
      email: lead!.email!.trim(),
      company: lead!.company || null,
    })

    if (clientError || !newClient) {
      return { success: false, message: 'Failed to create client' }
    }

    clientId = newClient.id
  }

  // Step 5: Auto-create client_user (first contact for this client)
  // Note: We continue even if this fails - it's not critical
  await client.createClientUser({
    client_id: clientId,
    name: lead!.name!,
    email: lead!.email!.trim(),
  })

  // Step 6: Create new project
  const { data: newProject, error: projectError } = await client.createProject({
    name: input.projectName || lead!.name!,
    type: input.projectType,
    status: input.projectStatus,
    client_id: clientId,
    assigned_to: input.assignedTo || null,
    description: lead!.message || null,
  })

  if (projectError || !newProject) {
    return { success: false, message: 'Failed to create project' }
  }

  // Step 7: Update the lead with conversion data
  const { error: updateError } = await client.updateLead(leadId, {
    status: 'converted',
    client_id: clientId,
    project_id: newProject.id,
    converted_at: now,
    archived_at: now,
    archived_by: employeeId,
  })

  if (updateError) {
    return { success: false, message: 'Failed to update lead status' }
  }

  return {
    success: true,
    message: linkedExisting
      ? `Lead converted! Linked to existing client "${existingClient!.name}"`
      : 'Lead converted successfully! New client and project created.',
    clientId,
    projectId: newProject.id,
    linkedExisting,
  }
}

/**
 * Archives a lead without converting
 */
export async function performArchiveLead(
  client: LeadConversionClient,
  leadId: string,
  employeeId: string
): Promise<{ success: boolean; message: string }> {
  const { error } = await client.archiveLead(leadId, employeeId)

  if (error) {
    return { success: false, message: 'Failed to archive lead' }
  }

  return { success: true, message: 'Lead archived successfully' }
}

/**
 * Restores an archived lead
 */
export async function performRestoreLead(
  client: LeadConversionClient,
  leadId: string
): Promise<{ success: boolean; message: string }> {
  // First check if the lead was converted
  const { data: lead } = await client.getLead(leadId)

  if (lead?.converted_at) {
    return { success: false, message: 'Cannot restore a converted lead' }
  }

  const { error } = await client.restoreLead(leadId)

  if (error) {
    return { success: false, message: 'Failed to restore lead' }
  }

  return { success: true, message: 'Lead restored successfully' }
}
