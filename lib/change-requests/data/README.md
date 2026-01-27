# Change Requests Data Layer

This directory contains the modular data layer for change requests.

## Structure

```
data/
├── index.ts          # Re-exports all functions
├── queries.ts        # Database query operations
├── transforms.ts     # Data transformation and calculations
└── utils.ts          # Utility functions
```

## Files

### `queries.ts`
All database operations including:
- `getChangeRequestsByProject` - Fetch all change requests for a project
- `getChangeRequestById` - Get single change request
- `getChangeRequestByToken` - Get by portal token (for signing)
- `createChangeRequest` - Create new draft
- `updateChangeRequest` - Update existing
- `deleteChangeRequest` - Delete draft
- `sendChangeRequest` - Send for signing
- `signChangeRequest` - Sign and create milestone
- `rejectChangeRequest` - Reject from portal
- `archiveChangeRequest` - Archive

### `transforms.ts`
Data transformation and calculation logic:
- `getChangeRequestStats` - Calculate aggregated stats

### `utils.ts`
Utility functions:
- `generatePortalToken` - Generate secure portal tokens

## Backward Compatibility

The parent `lib/change-requests/data.ts` re-exports all functions from this directory, maintaining backward compatibility with existing imports.

## Usage

```typescript
// Import from the main data module (recommended)
import { getChangeRequestsByProject } from '@/lib/change-requests/data'

// Or import directly from specific modules (advanced)
import { getChangeRequestsByProject } from '@/lib/change-requests/data/queries'
import { getChangeRequestStats } from '@/lib/change-requests/data/transforms'
```
