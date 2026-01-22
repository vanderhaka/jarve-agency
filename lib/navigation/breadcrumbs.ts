export interface BreadcrumbItem {
  label: string
  href?: string
}

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // Always start with Dashboard
  breadcrumbs.push({ label: 'Dashboard', href: '/app' })

  // Handle different routes
  if (segments.length === 0 || segments[0] === 'app' && segments.length === 1) {
    // Just /app - only show Dashboard
    return [{ label: 'Dashboard' }]
  }

  // Remove 'app' or 'admin' prefix if present
  const cleanSegments = segments[0] === 'app' || segments[0] === 'admin' ? segments.slice(1) : segments

  for (let i = 0; i < cleanSegments.length; i++) {
    const segment = cleanSegments[i]
    const isLast = i === cleanSegments.length - 1

    // Check if this is a UUID (detail page)
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)

    if (isId) {
      // This is a detail page - use the parent segment name with "Details"
      const parentSegment = cleanSegments[i - 1]
      const parentLabel = getLabelForSegment(parentSegment)
      breadcrumbs.push({
        label: `${parentLabel.slice(0, -1)} Details`, // Remove 's' and add ' Details'
      })
    } else {
      // Regular segment
      const label = getLabelForSegment(segment)
      const href = isLast ? undefined : buildHref(segments.slice(0, segments.indexOf(segment) + 1))
      breadcrumbs.push({ label, href })
    }
  }

  return breadcrumbs
}

function getLabelForSegment(segment: string): string {
  const labelMap: Record<string, string> = {
    app: 'Dashboard',
    leads: 'Leads',
    clients: 'Clients',
    projects: 'Projects',
    tasks: 'Tasks',
    employees: 'Team',
    audit: 'Activity Log',
    admin: 'Admin',
  }

  return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
}

function buildHref(segments: string[]): string {
  return '/' + segments.join('/')
}
