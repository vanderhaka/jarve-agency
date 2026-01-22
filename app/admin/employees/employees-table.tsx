'use client'

import { useState, useTransition } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/terra-flow/ui/checkbox'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/terra-flow/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/terra-flow/ui/select'
import { BulkActionsBar } from '@/components/table/bulk-actions-bar'
import { useTableSelection } from '@/hooks/use-table-selection'
import { bulkChangeRole } from './actions'
import { useToast } from '@/hooks/terra-flow/use-toast'

interface Employee {
  id: string
  name: string | null
  email: string
  role: string
  created_at: string | null
}

interface EmployeesTableProps {
  employees: Employee[]
  currentUserId: string
  onInviteClick?: () => void
}

export function EmployeesTable({ employees, currentUserId, onInviteClick }: EmployeesTableProps) {
  const {
    selectedIds,
    selectedCount,
    toggle,
    toggleAll,
    clear,
    isSelected,
    isAllSelected,
  } = useTableSelection()

  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState<'admin' | 'employee'>('employee')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const allIds = employees.map((e) => e.id)

  function handleChangeRole() {
    startTransition(async () => {
      const result = await bulkChangeRole(selectedIds, newRole)

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        })
        clear()
        setIsRoleDialogOpen(false)
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected(allIds)}
                onCheckedChange={() => toggleAll(allIds)}
                aria-label="Select all employees"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(!employees || employees.length === 0) ? (
            <TableRow>
              <TableCell colSpan={5} className="p-0">
                <EmptyState
                  icon={Users}
                  title="No team members yet"
                  description="Invite your first team member to start collaborating on leads and projects."
                  action={onInviteClick ? {
                    label: "Invite Team Member",
                    onClick: onInviteClick
                  } : undefined}
                />
              </TableCell>
            </TableRow>
          ) : (
          employees.map((member, index) => (
            <TableRow key={member.id}>
              <TableCell>
                <Checkbox
                  checked={isSelected(member.id)}
                  onCheckedChange={() => toggle(member.id, index, allIds)}
                  aria-label={`Select ${member.name || member.email}`}
                />
              </TableCell>
              <TableCell className="font-medium">{member.name || 'Pending'}</TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>
                <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                  {member.role}
                </Badge>
              </TableCell>
              <TableCell>{member.created_at ? new Date(member.created_at).toLocaleDateString() : '—'}</TableCell>
            </TableRow>
          ))
          )}
        </TableBody>
      </Table>

      <BulkActionsBar selectedCount={selectedCount} onClear={clear}>
        <Button
          size="sm"
          onClick={() => setIsRoleDialogOpen(true)}
        >
          Change Role
        </Button>
      </BulkActionsBar>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedCount} selected {selectedCount === 1 ? 'employee' : 'employees'}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={newRole} onValueChange={(v) => setNewRole(v as 'admin' | 'employee')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={isPending}>
              {isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
