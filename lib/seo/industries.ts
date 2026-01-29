import type { Industry } from './types'

export const industries: Industry[] = [
  {
    slug: 'healthcare',
    name: 'Healthcare',
    painPoints: ['Patient data scattered across systems', 'Manual appointment scheduling', 'Compliance and reporting burden', 'Staff rostering complexity'],
    keywords: ['healthcare software', 'medical practice', 'patient management', 'health tech'],
  },
  {
    slug: 'real-estate',
    name: 'Real Estate',
    painPoints: ['Property listing management chaos', 'Manual tenant communications', 'Slow settlement processes', 'Disconnected agent tools'],
    keywords: ['real estate software', 'property management', 'proptech', 'agent tools'],
  },
  {
    slug: 'construction',
    name: 'Construction',
    painPoints: ['Project cost blowouts', 'Paper-based site documentation', 'Subcontractor coordination', 'Safety compliance tracking'],
    keywords: ['construction software', 'project management', 'site management', 'building tech'],
  },
  {
    slug: 'logistics',
    name: 'Logistics',
    painPoints: ['Shipment visibility gaps', 'Manual route planning', 'Warehouse inventory inaccuracy', 'Driver communication delays'],
    keywords: ['logistics software', 'supply chain', 'fleet management', 'warehouse management'],
  },
  {
    slug: 'finance',
    name: 'Finance',
    painPoints: ['Manual reconciliation processes', 'Regulatory compliance burden', 'Client reporting inefficiency', 'Legacy system integration'],
    keywords: ['fintech', 'financial software', 'accounting automation', 'regulatory compliance'],
  },
  {
    slug: 'education',
    name: 'Education',
    painPoints: ['Student enrollment bottlenecks', 'Course management complexity', 'Parent communication gaps', 'Assessment tracking limitations'],
    keywords: ['edtech', 'learning management', 'student portal', 'education software'],
  },
  {
    slug: 'hospitality',
    name: 'Hospitality',
    painPoints: ['Booking system fragmentation', 'Staff scheduling headaches', 'Guest experience inconsistency', 'Revenue management blind spots'],
    keywords: ['hospitality software', 'booking system', 'hotel management', 'restaurant tech'],
  },
  {
    slug: 'retail',
    name: 'Retail',
    painPoints: ['Inventory sync across channels', 'Customer data silos', 'Manual order processing', 'Supplier management complexity'],
    keywords: ['retail software', 'ecommerce', 'inventory management', 'point of sale'],
  },
  {
    slug: 'legal',
    name: 'Legal',
    painPoints: ['Document management overload', 'Time tracking inaccuracy', 'Client intake inefficiency', 'Matter management complexity'],
    keywords: ['legal tech', 'law firm software', 'case management', 'document automation'],
  },
  {
    slug: 'mining',
    name: 'Mining',
    painPoints: ['Remote site connectivity', 'Safety incident reporting', 'Equipment maintenance tracking', 'Environmental compliance'],
    keywords: ['mining software', 'resources tech', 'site management', 'safety compliance'],
  },
  {
    slug: 'agriculture',
    name: 'Agriculture',
    painPoints: ['Crop monitoring limitations', 'Supply chain traceability', 'Weather response planning', 'Labour management in remote areas'],
    keywords: ['agtech', 'farm management', 'agriculture software', 'precision farming'],
  },
  {
    slug: 'manufacturing',
    name: 'Manufacturing',
    painPoints: ['Production scheduling inefficiency', 'Quality control gaps', 'Supply chain visibility', 'Equipment downtime tracking'],
    keywords: ['manufacturing software', 'production management', 'quality control', 'Industry 4.0'],
  },
]
