import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Input validation schema
const favoriteSchema = z.object({
  entityType: z.enum(['lead', 'client', 'project', 'employee']),
  entityId: z.string().uuid(),
  entityName: z.string().min(1).max(200),
  entitySubtitle: z.string().max(200).optional(),
})

// GET /api/favorites - List all user favorites
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: favorites, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }

  return NextResponse.json({
    favorites: favorites.map((f) => ({
      id: f.id,
      entityType: f.entity_type,
      entityId: f.entity_id,
      entityName: f.entity_name,
      entitySubtitle: f.entity_subtitle,
      createdAt: f.created_at,
    })),
  })
}

// POST /api/favorites - Add a favorite
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = favoriteSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.errors },
      { status: 400 }
    )
  }

  const { entityType, entityId, entityName, entitySubtitle } = validation.data

  // Check if already favorited
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Already favorited' }, { status: 409 })
  }

  // Insert new favorite (trigger will enforce 20 limit)
  const { data: favorite, error } = await supabase
    .from('favorites')
    .insert({
      user_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      entity_subtitle: entitySubtitle,
    })
    .select()
    .single()

  if (error) {
    // Handle limit exceeded error
    if (error.message?.includes('Maximum favorites limit')) {
      return NextResponse.json(
        { error: 'Maximum favorites limit (20) reached. Remove some favorites first.' },
        { status: 400 }
      )
    }
    console.error('Error creating favorite:', error)
    return NextResponse.json({ error: 'Failed to create favorite' }, { status: 500 })
  }

  return NextResponse.json({
    favorite: {
      id: favorite.id,
      entityType: favorite.entity_type,
      entityId: favorite.entity_id,
      entityName: favorite.entity_name,
      entitySubtitle: favorite.entity_subtitle,
      createdAt: favorite.created_at,
    },
  })
}

// DELETE /api/favorites - Remove a favorite
export async function DELETE(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get('entityType')
  const entityId = searchParams.get('entityId')

  if (!entityType || !entityId) {
    return NextResponse.json(
      { error: 'Missing entityType or entityId parameters' },
      { status: 400 }
    )
  }

  // Validate entityType
  if (!['lead', 'client', 'project', 'employee'].includes(entityType)) {
    return NextResponse.json({ error: 'Invalid entityType' }, { status: 400 })
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(entityId)) {
    return NextResponse.json({ error: 'Invalid entityId format' }, { status: 400 })
  }

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)

  if (error) {
    console.error('Error deleting favorite:', error)
    return NextResponse.json({ error: 'Failed to delete favorite' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
