'use server'

import { createClient } from '@/utils/supabase/server'
import {
  createProposalSignedNotification,
  createChangeRequestSignedNotification,
  createInvoicePaidNotification,
} from './helpers'
import type { NotificationInsert } from './types'

/**
 * Create a notification for proposal signed event
 */
export async function notifyProposalSigned(
  proposalId: string,
  proposalTitle: string,
  projectName: string,
  ownerId: string
): Promise<boolean> {
  const notification = createProposalSignedNotification(
    proposalId,
    proposalTitle,
    projectName,
    ownerId
  )
  return insertNotification(notification)
}

/**
 * Create a notification for change request signed event
 */
export async function notifyChangeRequestSigned(
  crId: string,
  crTitle: string,
  projectName: string,
  ownerId: string
): Promise<boolean> {
  const notification = createChangeRequestSignedNotification(
    crId,
    crTitle,
    projectName,
    ownerId
  )
  return insertNotification(notification)
}

/**
 * Create a notification for invoice paid event
 */
export async function notifyInvoicePaid(
  invoiceId: string,
  invoiceNumber: string,
  clientName: string,
  amount: number,
  ownerId: string
): Promise<boolean> {
  const notification = createInvoicePaidNotification(
    invoiceId,
    invoiceNumber,
    clientName,
    amount,
    ownerId
  )
  return insertNotification(notification)
}

/**
 * Helper to insert a notification
 */
async function insertNotification(notification: NotificationInsert): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .upsert(notification, {
      onConflict: 'user_id,entity_type,entity_id,type',
      ignoreDuplicates: true,
    })

  if (error) {
    // Ignore duplicate key errors
    if (error.code === '23505') return true
    console.error('Error inserting notification:', error)
    return false
  }

  return true
}
