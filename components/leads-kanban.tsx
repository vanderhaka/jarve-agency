'use client'

import { useState, useId } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
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
}

const stages = ['new', 'contacted', 'converted', 'closed']

const statusColors: Record<string, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  converted: 'bg-green-500',
  closed: 'bg-gray-500',
}

function SortableLead({ lead }: { lead: Lead }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 touch-none">
      <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between items-start">
            <div className="font-medium">{lead.name}</div>
            {lead.amount > 0 && (
              <Badge variant="secondary" className="text-xs">
                ${lead.amount.toLocaleString()}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">{lead.email}</div>
          {lead.source && (
            <div className="text-xs text-muted-foreground">Via: {lead.source}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function LeadsKanban({ initialLeads }: { initialLeads: Lead[] }) {
  const dndId = useId()
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [activeId, setActiveId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    
    if (!over) return

    const activeLead = leads.find((l) => l.id === active.id)
    const overContainer = over.id as string

    if (activeLead && activeLead.status !== overContainer && stages.includes(overContainer)) {
      // Moved to a different column (status change)
      setLeads((prev) => {
        return prev.map((l) => {
          if (l.id === activeLead.id) {
            return { ...l, status: overContainer }
          }
          return l
        })
      })

      // Update in DB
      await supabase
        .from('leads')
        .update({ status: overContainer })
        .eq('id', activeLead.id)
        
      router.refresh()
    }
    
    setActiveId(null)
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
      onDragStart={(event) => setActiveId(event.active.id as string)}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {stages.map((stage) => (
          <div key={stage} className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${statusColors[stage]}`} />
                <span className="capitalize font-medium">{stage}</span>
              </div>
              <Badge variant="secondary">
                {leads.filter((l) => l.status === stage).length}
              </Badge>
            </div>
            
            <div className="flex-1 bg-muted/20 rounded-lg p-2 overflow-y-auto">
              <SortableContext
                id={stage}
                items={leads.filter((l) => l.status === stage).map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                {leads
                  .filter((l) => l.status === stage)
                  .map((lead) => (
                    <SortableLead key={lead.id} lead={lead} />
                  ))}
              </SortableContext>
              {/* Drop zone for empty columns */}
              {leads.filter((l) => l.status === stage).length === 0 && (
                 <SortableContext id={stage} items={[]} strategy={verticalListSortingStrategy}>
                    <div className="h-full min-h-[100px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                      Drop here
                    </div>
                 </SortableContext>
              )}
            </div>
          </div>
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



