'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateTaskAction, deleteTaskAction } from './actions'
import {
  Task,
  TASK_STATUSES,
  TASK_TYPES,
  TASK_PRIORITIES,
  TaskStatus,
  TaskType,
  TaskPriority,
} from '@/lib/tasks/types'

interface Props {
  task: Task | null
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailSheet({ task, projectId, open, onOpenChange }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Form state - reset when task changes
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('Backlog')
  const [type, setType] = useState<TaskType>('feature')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [estimate, setEstimate] = useState('')
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('')
  const [blockers, setBlockers] = useState('')

  // Reset form when task changes - using key pattern instead of effect
  const taskId = task?.id

  // Initialize form state from task prop
  const initialTitle = task?.title ?? ''
  const initialDescription = task?.description ?? ''
  const initialStatus = task?.status ?? 'Backlog'
  const initialType = task?.type ?? 'feature'
  const initialPriority = task?.priority ?? 'medium'
  const initialDueDate = task?.due_date ?? ''
  const initialEstimate = task?.estimate?.toString() ?? ''
  const initialAcceptanceCriteria = task?.acceptance_criteria ?? ''
  const initialBlockers = task?.blockers ?? ''

  // Reset form when task ID changes
  useEffect(() => {
    if (taskId) {
      setTitle(initialTitle)
      setDescription(initialDescription)
      setStatus(initialStatus)
      setType(initialType)
      setPriority(initialPriority)
      setDueDate(initialDueDate)
      setEstimate(initialEstimate)
      setAcceptanceCriteria(initialAcceptanceCriteria)
      setBlockers(initialBlockers)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  async function handleSave() {
    if (!task) return
    setLoading(true)

    const result = await updateTaskAction(task.id, projectId, {
      title,
      description: description || null,
      status,
      type,
      priority,
      due_date: dueDate || null,
      estimate: estimate ? parseFloat(estimate) : null,
      acceptance_criteria: acceptanceCriteria || null,
      blockers: blockers || null,
    })

    setLoading(false)

    if (result.success) {
      toast.success('Task updated')
      onOpenChange(false)
      router.refresh()
    } else {
      toast.error(`Failed to update task: ${result.error}`)
    }
  }

  async function handleDelete() {
    if (!task) return
    setDeleting(true)

    const result = await deleteTaskAction(task.id, projectId)

    setDeleting(false)

    if (result.success) {
      toast.success('Task deleted')
      onOpenChange(false)
      router.refresh()
    } else {
      toast.error(`Failed to delete task: ${result.error}`)
    }
  }

  function handleCancel() {
    // Reset to original values
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? '')
      setStatus(task.status)
      setType(task.type)
      setPriority(task.priority)
      setDueDate(task.due_date ?? '')
      setEstimate(task.estimate?.toString() ?? '')
      setAcceptanceCriteria(task.acceptance_criteria ?? '')
      setBlockers(task.blockers ?? '')
    }
    onOpenChange(false)
  }

  if (!task) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Task</SheetTitle>
          <SheetDescription>
            Make changes to your task. Click save when done.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Task description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={v => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={v => setType(v as TaskType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={v => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimate">Estimate (hours)</Label>
              <Input
                id="estimate"
                type="number"
                step="0.5"
                min="0"
                value={estimate}
                onChange={e => setEstimate(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acceptance_criteria">Acceptance Criteria</Label>
            <Textarea
              id="acceptance_criteria"
              value={acceptanceCriteria}
              onChange={e => setAcceptanceCriteria(e.target.value)}
              placeholder="What must be true for this task to be considered done?"
              rows={3}
            />
          </div>

          {status === 'Blocked' && (
            <div className="space-y-2">
              <Label htmlFor="blockers">Blockers</Label>
              <Textarea
                id="blockers"
                value={blockers}
                onChange={e => setBlockers(e.target.value)}
                placeholder="What is blocking this task?"
                rows={2}
              />
            </div>
          )}
        </div>

        <SheetFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            size="sm"
            className="sm:mr-auto"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>

          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !title.trim()}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete task?</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{task.title}&rdquo;. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
