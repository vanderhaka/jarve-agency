'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'
import { Loader2, PlusCircle } from 'lucide-react'
import { EmployeeSelect } from '@/components/employee-select'

interface TaskDialogProps {
  leadId?: string
  projectId?: string
  triggerLabel?: string
}

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  created_at: string
  employees?: {
    name: string
  }
}

const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

const statusColors: Record<string, string> = {
  todo: 'bg-muted text-foreground',
  in_progress: 'bg-blue-500 text-white',
  done: 'bg-green-500 text-white',
}

export function TaskDialog({ leadId, projectId, triggerLabel = 'Tasks' }: TaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null)
  const supabase = createClient()

  const [formState, setFormState] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    assigned_to: 'unassigned',
  })

  const fetchCurrentEmployee = async () => {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return

    const { data } = await supabase
      .from('employees')
      .select('id')
      .eq('id', userId)
      .single()

    if (data) {
      setCurrentEmployeeId(data.id)
    }
  }

  const fetchTasks = async () => {
    setLoading(true)
    const query = supabase
      .from('tasks')
      .select('*, employees(name)')
      .order('created_at', { ascending: false })

    if (leadId) {
      query.eq('lead_id', leadId)
    }
    if (projectId) {
      query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
    } else if (data) {
      setTasks(data as Task[])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchCurrentEmployee()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (open) {
      fetchTasks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function handleCreateTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCreating(true)

    const { error } = await supabase.from('tasks').insert({
      title: formState.title,
      description: formState.description,
      status: formState.status,
      priority: formState.priority,
      due_date: formState.due_date || null,
      lead_id: leadId,
      project_id: projectId,
      assigned_to: formState.assigned_to === 'unassigned' ? null : formState.assigned_to,
      created_by: currentEmployeeId,
    })

    if (error) {
      console.error('Error creating task:', error)
      alert('Failed to create task')
    } else {
      setFormState({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: '',
        assigned_to: 'unassigned',
      })
      fetchTasks()
    }

    setCreating(false)
  }

  async function handleStatusChange(taskId: string, status: string) {
    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId)

    if (!error) {
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status } : task))
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tasks</DialogTitle>
          <DialogDescription>
            Track work items for this {leadId ? 'lead' : 'project'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formState.status}
                    onValueChange={(value) => setFormState({ ...formState, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formState.priority}
                    onValueChange={(value) => setFormState({ ...formState, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={formState.due_date}
                    onChange={(e) => setFormState({ ...formState, due_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <EmployeeSelect
                    name="assigned_to"
                    value={formState.assigned_to}
                    onChange={(value) => setFormState({ ...formState, assigned_to: value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving
                  </>
                ) : (
                  'Add Task'
                )}
              </Button>
            </form>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Existing Tasks</h3>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                Loading tasks...
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-muted-foreground text-sm">No tasks yet.</div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{task.title}</div>
                        <Select
                          value={task.status}
                          onValueChange={(value) => handleStatusChange(task.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {task.due_date && (
                          <span>Due {format(new Date(task.due_date), 'MMM d')}</span>
                        )}
                        <Badge className={statusColors[task.status] || 'bg-gray-500 text-white'}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        {task.employees ? (
                          <span>Assigned to {task.employees.name}</span>
                        ) : (
                          <span>Unassigned</span>
                        )}
                        <span className="capitalize">Priority: {task.priority}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
