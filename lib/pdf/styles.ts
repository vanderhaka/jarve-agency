import { StyleSheet, Font } from '@react-pdf/renderer'

// Register fonts (using default system fonts for now)
// Can be extended with custom fonts later

export const colors = {
  primary: '#0f172a', // slate-900
  secondary: '#475569', // slate-600
  muted: '#94a3b8', // slate-400
  border: '#e2e8f0', // slate-200
  background: '#f8fafc', // slate-50
  white: '#ffffff',
  accent: '#3b82f6', // blue-500
}

export const styles = StyleSheet.create({
  // Page
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: colors.primary,
    backgroundColor: colors.white,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    width: 120,
    height: 40,
  },
  headerRight: {
    textAlign: 'right',
  },
  documentTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 4,
  },
  documentSubtitle: {
    fontSize: 10,
    color: colors.secondary,
  },

  // Meta info
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    padding: 15,
    backgroundColor: colors.background,
    borderRadius: 4,
  },
  metaColumn: {
    width: '48%',
  },
  metaLabel: {
    fontSize: 8,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    color: colors.primary,
    marginBottom: 8,
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionBody: {
    fontSize: 10,
    color: colors.secondary,
    lineHeight: 1.6,
  },

  // Lists
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  listBullet: {
    width: 15,
    fontSize: 10,
    color: colors.accent,
  },
  listText: {
    flex: 1,
    fontSize: 10,
    color: colors.secondary,
  },

  // Pricing table
  pricingTable: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 4,
  },
  tableHeaderText: {
    color: colors.white,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: colors.background,
  },
  tableCell: {
    fontSize: 9,
    color: colors.secondary,
  },
  tableCellDescription: {
    flex: 3,
  },
  tableCellQty: {
    width: 50,
    textAlign: 'center',
  },
  tableCellPrice: {
    width: 80,
    textAlign: 'right',
  },
  tableCellTotal: {
    width: 80,
    textAlign: 'right',
  },

  // Totals
  totalsSection: {
    marginTop: 15,
    marginLeft: 'auto',
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: colors.secondary,
  },
  totalValue: {
    fontSize: 10,
    color: colors.primary,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },

  // Terms
  termsSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: colors.background,
    borderRadius: 4,
  },
  termsTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 8,
  },
  termsText: {
    fontSize: 9,
    color: colors.secondary,
    lineHeight: 1.5,
  },

  // Signature
  signatureSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signatureTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 15,
  },
  signatureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 8,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  signatureValue: {
    fontSize: 10,
    color: colors.primary,
    marginBottom: 10,
  },
  signatureImage: {
    width: 150,
    height: 50,
    marginTop: 5,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: colors.muted,
  },
  pageNumber: {
    fontSize: 8,
    color: colors.muted,
  },
})

export const formatCurrency = (amount: number, currency = 'AUD'): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
  }).format(amount)
}

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
