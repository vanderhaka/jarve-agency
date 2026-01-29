import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { rateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

const resend = new Resend(process.env.RESEND_API_KEY)

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(request: Request) {
  // Rate limit by IP
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { ok } = rateLimit(ip, { limit: 5, windowMs: 60_000 })
  if (!ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429 }
    )
  }

  const body = await request.json()
  const { name, email, company, project_type, budget, timeline, message, website } = body

  // Honeypot: bots filling the hidden "website" field get silently rejected
  if (website) {
    return NextResponse.json({ success: true, id: 'ok' })
  }

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      name,
      email,
      company: company || null,
      project_type: project_type || null,
      budget: budget || null,
      timeline: timeline || null,
      message: message || null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This email has already been submitted.' }, { status: 409 })
    }
    console.error('[api/leads] Insert failed:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }

  // Send email notification to team
  const notifyEmail = process.env.LEAD_NOTIFY_EMAIL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (notifyEmail && siteUrl) {
    try {
      const safeName = escapeHtml(name)
      const safeEmail = escapeHtml(email)
      const safeCompany = company ? escapeHtml(company) : ''
      const safeProjectType = project_type ? escapeHtml(project_type.replace(/_/g, ' ')) : ''
      const safeBudget = budget ? escapeHtml(budget.replace(/_/g, ' ')) : ''
      const safeTimeline = timeline ? escapeHtml(timeline.replace(/_/g, ' ')) : ''
      const safeMessage = message ? escapeHtml(message) : ''

      await resend.emails.send({
        from: 'JARVE <leads@jarve.com.au>',
        to: notifyEmail,
        subject: `New Lead: ${safeName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #f8f9fa; border-radius: 8px; padding: 32px; margin-bottom: 24px;">
                <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">New Lead Received</h1>
                <p style="margin: 0; color: #666;">A new enquiry has come through the website.</p>
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: 600; width: 120px;">Name</td><td style="padding: 8px 0;">${safeName}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: 600;">Email</td><td style="padding: 8px 0;"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
                ${safeCompany ? `<tr><td style="padding: 8px 0; font-weight: 600;">Company</td><td style="padding: 8px 0;">${safeCompany}</td></tr>` : ''}
                ${safeProjectType ? `<tr><td style="padding: 8px 0; font-weight: 600;">Project Type</td><td style="padding: 8px 0;">${safeProjectType}</td></tr>` : ''}
                ${safeBudget ? `<tr><td style="padding: 8px 0; font-weight: 600;">Budget</td><td style="padding: 8px 0;">${safeBudget}</td></tr>` : ''}
                ${safeTimeline ? `<tr><td style="padding: 8px 0; font-weight: 600;">Timeline</td><td style="padding: 8px 0;">${safeTimeline}</td></tr>` : ''}
                ${safeMessage ? `<tr><td style="padding: 8px 0; font-weight: 600;">Message</td><td style="padding: 8px 0;">${safeMessage}</td></tr>` : ''}
              </table>
              <div style="margin-top: 24px;">
                <a href="${siteUrl}/admin/leads/${lead.id}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">View Lead</a>
              </div>
            </body>
          </html>
        `,
      })
    } catch (emailError) {
      console.error('[api/leads] Email notification failed:', emailError)
    }
  }

  return NextResponse.json({ success: true, id: lead.id })
}
