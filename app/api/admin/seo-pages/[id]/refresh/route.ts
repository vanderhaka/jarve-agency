import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isAuthError } from '@/lib/auth/require-admin'
import { refreshPageContent } from '@/lib/seo/refresh'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (isAuthError(auth)) return auth

  const { id } = await params
  const result = await refreshPageContent(id)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
