import {
  Users,
  UserCircle,
  Briefcase,
  Shield,
  Flag,
  FileEdit,
  FileSignature,
} from 'lucide-react'

export const typeIcons = {
  lead: Users,
  client: UserCircle,
  project: Briefcase,
  employee: Shield,
  milestone: Flag,
  change_request: FileEdit,
  proposal: FileSignature,
}

export const typeLabels = {
  lead: 'Leads',
  client: 'Clients',
  project: 'Projects',
  employee: 'Team',
  milestone: 'Milestones',
  change_request: 'Change Requests',
  proposal: 'Proposals',
}
