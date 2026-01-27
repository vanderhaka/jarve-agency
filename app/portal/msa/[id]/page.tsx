'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, AlertCircle, FileSignature } from 'lucide-react'
import { signMSA, MSAContent } from '@/app/admin/proposals/msa-actions'
import { SignatureCapture } from '@/components/signature-capture'

interface MSA {
  id: string
  title: string
  status: string
  content: MSAContent
  client?: { name: string }
}

export default function PortalMSAPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const msaId = params.id as string
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msa, setMsa] = useState<MSA | null>(null)
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [signatureSvg, setSignatureSvg] = useState('')
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)

  const supabase = createClient()

  const fetchMSA = useCallback(async () => {
    if (!token) {
      setError('Invalid access link')
      setLoading(false)
      return
    }

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('client_portal_tokens')
      .select('id, revoked_at, client_user_id, client_users(client_id)')
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

    // Supabase joins return arrays - extract first element
    const clientUsersData = tokenData.client_users
    const clientUser = Array.isArray(clientUsersData) ? clientUsersData[0] : clientUsersData

    if (!clientUser) {
      setError('Invalid client user')
      setLoading(false)
      return
    }

    // Fetch MSA
    const { data, error: msaError } = await supabase
      .from('client_msas')
      .select(`
        id, title, status, content, client_id,
        client:clients(name)
      `)
      .eq('id', msaId)
      .single()

    if (msaError || !data) {
      setError('MSA not found')
      setLoading(false)
      return
    }

    // Verify MSA belongs to the token's client
    if (data.client_id !== clientUser.client_id) {
      setError('Access denied')
      setLoading(false)
      return
    }

    // Transform client from array to object
    const clientData = Array.isArray(data.client) ? data.client[0] : data.client
    setMsa({
      id: data.id,
      title: data.title,
      status: data.status,
      content: data.content,
      client: clientData
    })

    if (data.status === 'signed') {
      setSigned(true)
    }

    // Pre-fill signer info
    const { data: clientUserData } = await supabase
      .from('client_users')
      .select('name, email')
      .eq('id', tokenData.client_user_id)
      .single()

    if (clientUserData) {
      setSignerName(clientUserData.name)
      setSignerEmail(clientUserData.email)
    }

    setLoading(false)
  }, [supabase, msaId, token])

  useEffect(() => {
    void fetchMSA()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSign = async () => {
    if (!signerName.trim() || !signerEmail.trim() || !signatureSvg || !token) {
      return
    }

    setSigning(true)

    const result = await signMSA(msaId, {
      token,
      signerName: signerName.trim(),
      signerEmail: signerEmail.trim(),
      signatureSvg,
      ipAddress: ''
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
                  Thanks for signing the Master Service Agreement — we&apos;re excited to work with you.
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

  if (!msa) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <FileSignature className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{msa.title}</h1>
                <p className="text-muted-foreground">{msa.client?.name}</p>
              </div>
              <Badge className="ml-auto">Ready for Signature</Badge>
            </div>
          </CardContent>
        </Card>

        {/* MSA Content Sections */}
        {msa.content?.sections
          ?.sort((a, b) => a.order - b.order)
          .map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{section.body}</p>
              </CardContent>
            </Card>
          ))}

        {/* Signature */}
        <Card>
          <CardHeader>
            <CardTitle>Sign Agreement</CardTitle>
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
              By signing this Master Service Agreement, you agree to the terms and
              conditions outlined above for all future Statements of Work.
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
            >
              {signing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Sign Agreement
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
