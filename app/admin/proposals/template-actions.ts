'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ProposalSection } from './actions'

// ============================================================
// Types
// ============================================================

export interface CreateTemplateInput {
  name: string
  sections: ProposalSection[]
  defaultTerms?: string
  isDefault?: boolean
}

export interface UpdateTemplateInput {
  name?: string
  sections?: ProposalSection[]
  defaultTerms?: string
  isDefault?: boolean
}

// ============================================================
// List Templates
// ============================================================

export async function listTemplates() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: templates, error } = await supabase
    .from('proposal_templates')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    console.error('[listTemplates] Error:', error)
    return { success: false, templates: [] }
  }

  return { success: true, templates }
}

// ============================================================
// Get Template
// ============================================================

export async function getTemplate(templateId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: template, error } = await supabase
    .from('proposal_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (error || !template) {
    return { success: false, message: 'Template not found', template: null }
  }

  return { success: true, template }
}

// ============================================================
// Create Template
// ============================================================

export async function createTemplate(input: CreateTemplateInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // If setting as default, unset other defaults first
  if (input.isDefault) {
    await supabase
      .from('proposal_templates')
      .update({ is_default: false })
      .eq('is_default', true)
  }

  const { data: template, error } = await supabase
    .from('proposal_templates')
    .insert({
      name: input.name,
      sections: input.sections,
      default_terms: input.defaultTerms || null,
      is_default: input.isDefault || false
    })
    .select('id')
    .single()

  if (error || !template) {
    console.error('[createTemplate] Error:', error)
    return { success: false, message: 'Failed to create template' }
  }

  revalidatePath('/admin/proposals')

  return {
    success: true,
    message: 'Template created successfully',
    templateId: template.id
  }
}

// ============================================================
// Update Template
// ============================================================

export async function updateTemplate(templateId: string, input: UpdateTemplateInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // If setting as default, unset other defaults first
  if (input.isDefault) {
    await supabase
      .from('proposal_templates')
      .update({ is_default: false })
      .neq('id', templateId)
  }

  const updateData: Record<string, unknown> = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.sections !== undefined) updateData.sections = input.sections
  if (input.defaultTerms !== undefined) updateData.default_terms = input.defaultTerms
  if (input.isDefault !== undefined) updateData.is_default = input.isDefault

  const { error } = await supabase
    .from('proposal_templates')
    .update(updateData)
    .eq('id', templateId)

  if (error) {
    console.error('[updateTemplate] Error:', error)
    return { success: false, message: 'Failed to update template' }
  }

  revalidatePath('/admin/proposals')
  revalidatePath(`/admin/proposals/templates/${templateId}`)

  return { success: true, message: 'Template updated successfully' }
}

// ============================================================
// Delete Template
// ============================================================

export async function deleteTemplate(templateId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Check if this is the default template
  const { data: template } = await supabase
    .from('proposal_templates')
    .select('is_default')
    .eq('id', templateId)
    .single()

  if (template?.is_default) {
    return { success: false, message: 'Cannot delete the default template' }
  }

  const { error } = await supabase
    .from('proposal_templates')
    .delete()
    .eq('id', templateId)

  if (error) {
    console.error('[deleteTemplate] Error:', error)
    return { success: false, message: 'Failed to delete template' }
  }

  revalidatePath('/admin/proposals')

  return { success: true, message: 'Template deleted successfully' }
}

// ============================================================
// Set Default Template
// ============================================================

export async function setDefaultTemplate(templateId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Unset all defaults
  await supabase
    .from('proposal_templates')
    .update({ is_default: false })
    .eq('is_default', true)

  // Set new default
  const { error } = await supabase
    .from('proposal_templates')
    .update({ is_default: true })
    .eq('id', templateId)

  if (error) {
    console.error('[setDefaultTemplate] Error:', error)
    return { success: false, message: 'Failed to set default template' }
  }

  revalidatePath('/admin/proposals')

  return { success: true, message: 'Default template updated' }
}
