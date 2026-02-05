/**
 * Export utilities for SEO data
 * Supports CSV and JSON formats
 */

/**
 * Convert array of objects to CSV string
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  columns: { key: string; label: string }[]
): string {
  // CSV header
  const header = columns.map((col) => escapeCSV(col.label)).join(',')

  if (data.length === 0) {
    return header
  }

  // CSV rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col.key]
        return escapeCSV(formatValue(value))
      })
      .join(',')
  })

  return [header, ...rows].join('\n')
}

/**
 * Format JSON export with proper structure
 */
export function exportToJSON(data: unknown): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Escape CSV value (handle quotes, commas, newlines)
 */
function escapeCSV(value: string): string {
  if (!value) return '""'

  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}

/**
 * Format value for CSV export
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return String(value)
}
