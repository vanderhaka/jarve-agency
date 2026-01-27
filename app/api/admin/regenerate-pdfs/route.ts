import { NextResponse } from 'next/server'
import { regenerateAllPendingPdfs } from '@/app/actions/contract-docs/regenerate-pdf'

export async function POST() {
  const result = await regenerateAllPendingPdfs()
  return NextResponse.json(result)
}
