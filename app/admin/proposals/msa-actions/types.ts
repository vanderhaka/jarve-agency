'use server'

// ============================================================
// Types
// ============================================================

export interface MSAContent {
  sections: {
    id: string
    title: string
    body: string
    order: number
  }[]
}

export interface CreateMSAInput {
  clientId: string
  title?: string
  content?: MSAContent
}

export interface SendMSAInput {
  clientUserId: string
}

// Re-export SignMSAInput for callers
export type { SignMSAInput } from '../schemas'
