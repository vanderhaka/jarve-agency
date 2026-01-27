import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Svg,
  Path,
} from '@react-pdf/renderer'
import { styles, colors, formatCurrency, formatDate } from './styles'

// Types matching proposal content structure
interface LineItem {
  id: string
  label: string
  qty: number
  unitPrice: number
  total: number
}

interface Pricing {
  lineItems: LineItem[]
  subtotal: number
  gstRate: number
  gstAmount: number
  total: number
}

interface TextSection {
  id: string
  type: 'text'
  title: string
  body: string
  order: number
}

interface ListSection {
  id: string
  type: 'list'
  title: string
  items: string[]
  order: number
}

interface PricingSection {
  id: string
  type: 'pricing'
  title: string
  order: number
}

type Section = TextSection | ListSection | PricingSection

interface ProposalContent {
  terms: string
  pricing: Pricing
  sections: Section[]
}

interface SignatureData {
  signerName: string
  signerEmail: string
  signedAt: string
  signatureSvg: string
  ipAddress?: string
}

interface AgencyInfo {
  name: string
  abn?: string
}

interface ClientInfo {
  name: string
  email?: string
  company?: string
}

interface ProjectInfo {
  name: string
}

export interface SowPdfProps {
  proposalTitle: string
  version: number
  content: ProposalContent
  signature: SignatureData
  agency: AgencyInfo
  client: ClientInfo
  project: ProjectInfo
  createdAt: string
}

// Helper to parse SVG path from signature
function SignatureSvg({ svg }: { svg: string }) {
  // Extract viewBox and path from SVG string
  const viewBoxMatch = svg.match(/viewBox="([^"]+)"/)
  const pathMatch = svg.match(/<path[^>]*d="([^"]+)"/)

  if (!viewBoxMatch || !pathMatch) {
    return <Text style={{ fontSize: 9, color: colors.muted }}>Signature on file</Text>
  }

  const viewBox = viewBoxMatch[1]
  const pathD = pathMatch[1]
  const [, , width, height] = viewBox.split(' ').map(Number)

  return (
    <Svg viewBox={viewBox} style={{ width: 150, height: 50 }}>
      <Path d={pathD} stroke={colors.primary} strokeWidth={2} fill="none" />
    </Svg>
  )
}

export function SowPdf({
  proposalTitle,
  version,
  content,
  signature,
  agency,
  client,
  project,
  createdAt,
}: SowPdfProps) {
  const sortedSections = [...content.sections].sort((a, b) => a.order - b.order)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.documentTitle}>Statement of Work</Text>
            <Text style={styles.documentSubtitle}>
              {proposalTitle} • Version {version}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: colors.primary }}>
              {agency.name || 'Agency'}
            </Text>
            {agency.abn && (
              <Text style={{ fontSize: 9, color: colors.muted, marginTop: 2 }}>
                ABN: {agency.abn}
              </Text>
            )}
          </View>
        </View>

        {/* Meta Information */}
        <View style={styles.metaSection}>
          <View style={styles.metaColumn}>
            <Text style={styles.metaLabel}>Prepared For</Text>
            <Text style={styles.metaValue}>{client.name}</Text>
            {client.company && (
              <>
                <Text style={styles.metaLabel}>Company</Text>
                <Text style={styles.metaValue}>{client.company}</Text>
              </>
            )}
            {client.email && (
              <>
                <Text style={styles.metaLabel}>Email</Text>
                <Text style={styles.metaValue}>{client.email}</Text>
              </>
            )}
          </View>
          <View style={styles.metaColumn}>
            <Text style={styles.metaLabel}>Project</Text>
            <Text style={styles.metaValue}>{project.name}</Text>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{formatDate(createdAt)}</Text>
            <Text style={styles.metaLabel}>Document ID</Text>
            <Text style={styles.metaValue}>SOW-v{version}</Text>
          </View>
        </View>

        {/* Content Sections */}
        {sortedSections.map((section) => {
          if (section.type === 'text' && section.body) {
            return (
              <View key={section.id} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionBody}>{section.body}</Text>
              </View>
            )
          }

          if (section.type === 'list' && section.items?.length > 0) {
            return (
              <View key={section.id} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.items.map((item, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <Text style={styles.listBullet}>•</Text>
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            )
          }

          if (section.type === 'pricing' && content.pricing.lineItems.length > 0) {
            return (
              <View key={section.id} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>

                {/* Pricing Table */}
                <View style={styles.pricingTable}>
                  {/* Header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, styles.tableCellDescription]}>
                      Description
                    </Text>
                    <Text style={[styles.tableHeaderText, styles.tableCellQty]}>Qty</Text>
                    <Text style={[styles.tableHeaderText, styles.tableCellPrice]}>Unit Price</Text>
                    <Text style={[styles.tableHeaderText, styles.tableCellTotal]}>Total</Text>
                  </View>

                  {/* Rows */}
                  {content.pricing.lineItems.map((item, idx) => (
                    <View
                      key={item.id}
                      style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
                    >
                      <Text style={[styles.tableCell, styles.tableCellDescription]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellQty]}>{item.qty}</Text>
                      <Text style={[styles.tableCell, styles.tableCellPrice]}>
                        {formatCurrency(item.unitPrice)}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellTotal]}>
                        {formatCurrency(item.total)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal</Text>
                    <Text style={styles.totalValue}>
                      {formatCurrency(content.pricing.subtotal)}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>
                      GST ({(content.pricing.gstRate * 100).toFixed(0)}%)
                    </Text>
                    <Text style={styles.totalValue}>
                      {formatCurrency(content.pricing.gstAmount)}
                    </Text>
                  </View>
                  <View style={styles.grandTotalRow}>
                    <Text style={styles.grandTotalLabel}>Total (inc. GST)</Text>
                    <Text style={styles.grandTotalValue}>
                      {formatCurrency(content.pricing.total)}
                    </Text>
                  </View>
                </View>
              </View>
            )
          }

          return null
        })}

        {/* Terms */}
        {content.terms && (
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>{content.terms}</Text>
          </View>
        )}

        {/* Signature */}
        <View style={styles.signatureSection}>
          <Text style={styles.signatureTitle}>Acceptance & Signature</Text>
          <View style={styles.signatureGrid}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Signed By</Text>
              <Text style={styles.signatureValue}>{signature.signerName}</Text>
              <Text style={styles.signatureLabel}>Email</Text>
              <Text style={styles.signatureValue}>{signature.signerEmail}</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Date Signed</Text>
              <Text style={styles.signatureValue}>{formatDate(signature.signedAt)}</Text>
              <Text style={styles.signatureLabel}>Signature</Text>
              <SignatureSvg svg={signature.signatureSvg} />
            </View>
          </View>
          {signature.ipAddress && (
            <Text style={{ fontSize: 7, color: colors.muted, marginTop: 10 }}>
              IP Address: {signature.ipAddress}
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {agency.name || 'Agency'} • Statement of Work
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
