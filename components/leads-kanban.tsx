'use client'

import { useState, useId, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type Lead = {
  id: string
  name: string
  email: string
  amount: number
  status: string
  source: string
  project_type?: string
  budget?: string
  timeline?: string
  created_at?: string
}

const stages = ['new', 'contacted', 'converted', 'closed']

const statusColors: Record<string, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  converted: 'bg-green-500',
  closed: 'bg-gray-500',
}

function SortableLead({ lead }: { lead: Lead }) {
  const router = useRouter()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  function handleClick() {
    if (!isDragging) {
      router.push(`/admin/leads/${lead.id}`)
    }
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 touch-none" onClick={handleClick}>
      <Card className="cursor-pointer active:cursor-grabbing hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between items-start">
            <span className="font-medium text-primary hover:underline">
                {lead.name}
              </span>
            {lead.amount > 0 && (
              <Badge variant="secondary" className="text-xs">
                ${lead.amount.toLocaleString()}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">{lead.email}</div>
          <div className="flex flex-wrap gap-1">
            {lead.project_type && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {lead.project_type.replace(/_/g, ' ')}
              </Badge>
            )}
            {lead.budget && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {lead.budget.replace(/_/g, ' ')}
              </Badge>
            )}
            {lead.timeline && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {lead.timeline.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
          {lead.source && (
            <div className="text-xs text-muted-foreground">Via: {lead.source}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StageColumn({ stage, leads }: { stage: string; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 p-2 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${statusColors[stage]}`} />
          <span className="capitalize font-medium">{stage}</span>
        </div>
        <Badge variant="secondary">
          {leads.length}
        </Badge>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 bg-muted/20 rounded-lg p-2 overflow-y-auto transition-colors ${isOver ? 'bg-muted/40 ring-2 ring-primary/20' : ''}`}
      >
        <SortableContext
          id={stage}
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <SortableLead key={lead.id} lead={lead} />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className="h-full min-h-[100px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}

export function LeadsKanban({ initialLeads }: { initialLeads: Lead[] }) {
  const dndId = useId()
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [originalStatus, setOriginalStatus] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  // Sync leads when initialLeads changes (e.g., after parent fetches data)
  useEffect(() => {
    setLeads(initialLeads)
  }, [initialLeads])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    console.log('[DragEnd] active:', active.id, 'over:', over?.id, 'originalStatus:', originalStatus)

    if (!over) {
      console.log('[DragEnd] No over target, aborting')
      setActiveId(null)
      setOriginalStatus(null)
      return
    }

    const activeLead = leads.find((l) => l.id === active.id)
    const overId = over.id as string

    // Determine target status: if dropped on a lead, use that lead's status
    // If dropped on the column itself, use the column id (stage name)
    const overLead = leads.find((l) => l.id === overId)
    const targetStatus = overLead ? overLead.status : overId

    console.log('[DragEnd] activeLead:', activeLead?.id, 'overId:', overId, 'targetStatus:', targetStatus)
    console.log('[DragEnd] Check: activeLead exists?', !!activeLead, 'originalStatus?', originalStatus, 'different?', originalStatus !== targetStatus, 'valid stage?', stages.includes(targetStatus))

    // Use originalStatus to check if we actually moved to a different column
    // (handleDragOver already updated local state, so we can't use activeLead.status)
    if (activeLead && originalStatus && originalStatus !== targetStatus && stages.includes(targetStatus)) {
      console.log('[DragEnd] Updating DB: lead', activeLead.id, 'from', originalStatus, 'to', targetStatus)

      // Update in DB
      const { data, error } = await supabase
        .from('leads')
        .update({ status: targetStatus })
        .eq('id', activeLead.id)
        .select()

      console.log('[DragEnd] DB response - data:', data, 'error:', error)

      if (error) {
        console.error('[DragEnd] Failed to update lead status:', error)
        // Revert local state on error
        setLeads((prev) =>
          prev.map((l) =>
            l.id === activeLead.id ? { ...l, status: originalStatus } : l
          )
        )
      } else {
        console.log('[DragEnd] Success! Refreshing...')
        router.refresh()
      }
    } else {
      console.log('[DragEnd] Skipping DB update - conditions not met')
    }

    setActiveId(null)
    setOriginalStatus(null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    // Find the containers
    const activeLead = leads.find(l => l.id === activeId)
    const overLead = leads.find(l => l.id === overId)
    
    if (!activeLead) return

    const activeStatus = activeLead.status
    const overStatus = overLead ? overLead.status : overId as string

    if (activeStatus !== overStatus && stages.includes(overStatus)) {
       setLeads((prev) => {
        return prev.map((l) => {
          if (l.id === activeId) {
            return { ...l, status: overStatus }
          }
          return l
        })
      })
    }
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(event) => {
        const leadId = event.active.id as string
        const lead = leads.find((l) => l.id === leadId)
        setActiveId(leadId)
        setOriginalStatus(lead?.status || null)
      }}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {stages.map((stage) => (
          <StageColumn key={stage} stage={stage} leads={leads.filter((l) => l.status === stage)} />
        ))}
      </div>
      
      <DragOverlay>
        {activeId ? (
           <Card className="shadow-xl cursor-grabbing opacity-80 rotate-2 w-[250px]">
             <CardContent className="p-4">
               <div className="font-medium">Moving Lead...</div>
             </CardContent>
           </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}



