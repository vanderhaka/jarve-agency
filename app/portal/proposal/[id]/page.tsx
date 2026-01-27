'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { signProposal, ProposalContent } from '@/app/admin/proposals/actions'
import { SignatureCapture } from '@/components/signature-capture'

interface ProposalVersion {
  id: string
  version: number
  content: ProposalContent
  subtotal: number
  gst_rate: number
  gst_amount: number
  total: number
}

interface Proposal {
  id: string
  title: string
  status: string
  current_version: number
  client?: { name: string }
  versions: ProposalVersion[]
}

export default function PortalProposalPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const proposalId = params.id as string
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [currentVersion, setCurrentVersion] = useState<ProposalVersion | null>(null)
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [signatureSvg, setSignatureSvg] = useState('')
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)

  const supabase = createClient()

  const fetchProposal = useCallback(async () => {
    if (!token) {
      setError('Invalid access link')
      setLoading(false)
      return
    }

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('client_portal_tokens')
      .select('id, revoked_at, client_user_id')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      setError('Invalid or expired access link')
      setLoading(false)
      return
    }

    if (tokenData.revoked_at) {
      setError('This access link has been revoked')
      setLoading(false)
      return
    }

    // Fetch proposal
    const { data, error: proposalError } = await supabase
      .from('proposals')
      .select(`
        id, title, status, current_version,
        client:clients(name),
        versions:proposal_versions(
          id, version, content, subtotal, gst_rate, gst_amount, total
        )
      `)
      .eq('id', proposalId)
      .single()

    if (proposalError || !data) {
      setError('Proposal not found')
      setLoading(false)
      return
    }

    // Transform data - Supabase joins return arrays
    const clientData = Array.isArray(data.client) ? data.client[0] : data.client
    const versionsData = Array.isArray(data.versions) ? data.versions : []
    const transformedProposal: Proposal = {
      id: data.id,
      title: data.title,
      status: data.status,
      current_version: data.current_version,
      client: clientData,
      versions: versionsData
    }
    setProposal(transformedProposal)

    if (data.status === 'signed') {
      setSigned(true)
    }

    // Find the version that was sent
    const version = versionsData.find(
      (v: ProposalVersion) => v.version === data.current_version
    )
    if (version) {
      setCurrentVersion(version)
    }

    // Pre-fill signer info from client user
    const { data: clientUser } = await supabase
      .from('client_users')
      .select('name, email')
      .eq('id', tokenData.client_user_id)
      .single()

    if (clientUser) {
      setSignerName(clientUser.name)
      setSignerEmail(clientUser.email)
    }

    setLoading(false)
  }, [supabase, proposalId, token])

  useEffect(() => {
    void fetchProposal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSign = async () => {
    if (!signerName.trim() || !signerEmail.trim() || !signatureSvg || !token) {
      return
    }

    setSigning(true)

    const result = await signProposal({
      token,
      signerName: signerName.trim(),
      signerEmail: signerEmail.trim(),
      signatureSvg
    })

    if (result.success) {
      setSigned(true)
    } else {
      setError(result.message)
    }

    setSigning(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <h2 className="text-xl font-semibold">Access Error</h2>
                <p className="text-muted-foreground mt-2">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center gap-6">
              <span className="text-3xl font-bold tracking-tight">JARVE</span>

              <div>
                <h2 className="text-2xl font-semibold">You&apos;re all set!</h2>
                <p className="text-muted-foreground mt-2">
                  Thanks for signing <span className="font-medium">{proposal?.title}</span> — we&apos;re excited to work with you.
                </p>
              </div>

              <div className="w-full border-t pt-6 space-y-4 text-left">
                <p className="text-sm text-muted-foreground text-center">
                  We&apos;ve set up your Client Portal where you&apos;ll find everything for your project:
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Signed documents &amp; contracts</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Direct messaging with the team</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>File uploads &amp; deliverables</span>
                  </li>
                </ul>
              </div>

              <div className="w-full pt-2 flex flex-col items-center gap-4">
                <a
                  href={`/portal/${token}`}
                  className="w-full inline-flex items-center justify-center rounded-lg bg-black text-white px-8 py-4 text-base font-semibold hover:bg-gray-800 transition-colors"
                >
                  Open Your Client Portal →
                </a>
                <p className="text-xs text-muted-foreground">
                  A confirmation email is on its way
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!proposal || !currentVersion) {
    return null
  }

  const content = currentVersion.content

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{proposal.title}</h1>
                <p className="text-muted-foreground">
                  {proposal.client?.name} • Version {currentVersion.version}
                </p>
              </div>
              <Badge className="ml-auto">Ready for Signature</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Content Sections */}
        {content.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {section.type === 'text' && (
                  <p className="whitespace-pre-wrap">{section.body}</p>
                )}
                {section.type === 'list' && (
                  <ul className="list-disc list-inside space-y-1">
                    {(section.items || []).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.type === 'pricing' && (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {content.pricing.lineItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.label}</TableCell>
                            <TableCell className="text-right">{item.qty}</TableCell>
                            <TableCell className="text-right">
                              ${item.unitPrice.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${item.total.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>${content.pricing.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>
                            GST ({(content.pricing.gstRate * 100).toFixed(0)}%):
                          </span>
                          <span>${content.pricing.gstAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>${content.pricing.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

        {/* Terms */}
        {content.terms && (
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {content.terms}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Signature */}
        <Card>
          <CardHeader>
            <CardTitle>Sign Proposal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="signerName">Your Name *</Label>
                <Input
                  id="signerName"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signerEmail">Your Email *</Label>
                <Input
                  id="signerEmail"
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Signature *</Label>
              <SignatureCapture
                onSignatureChange={setSignatureSvg}
                disabled={signing}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              By signing below, you agree to the terms and conditions outlined in
              this proposal and authorize the work to proceed.
            </div>

            <Button
              onClick={handleSign}
              disabled={
                signing ||
                !signerName.trim() ||
                !signerEmail.trim() ||
                !signatureSvg
              }
              className="w-full"
              size="lg"
              style={signatureSvg && signerName.trim() && signerEmail.trim() ? { backgroundColor: '#16a34a' } : undefined}
            >
              {signing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Sign Proposal
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
