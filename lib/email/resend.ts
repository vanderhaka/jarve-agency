import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendProposalEmailParams {
  to: string
  recipientName: string
  proposalTitle: string
  portalUrl: string
  companyName?: string
}

export async function sendProposalEmail({
  to,
  recipientName,
  proposalTitle,
  portalUrl,
  companyName = 'JARVE'
}: SendProposalEmailParams) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    throw new Error('NEXT_PUBLIC_SITE_URL environment variable is required')
  }
  const fullPortalUrl = `${siteUrl}${portalUrl}`

  const { data, error } = await resend.emails.send({
    from: 'JARVE <proposals@jarve.com.au>',
    to,
    subject: `Proposal: ${proposalTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; border-radius: 8px; padding: 32px; margin-bottom: 24px;">
            <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">
              ${companyName}
            </h1>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Proposal for your review
            </p>
          </div>

          <p style="margin: 0 0 16px 0;">
            Hi ${recipientName},
          </p>

          <p style="margin: 0 0 16px 0;">
            We've prepared a proposal for you: <strong>${proposalTitle}</strong>
          </p>

          <p style="margin: 0 0 24px 0;">
            Click the button below to review the details and sign if you're ready to proceed.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${fullPortalUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 500; font-size: 16px;">
              View Proposal
            </a>
          </div>

          <p style="margin: 24px 0 0 0; font-size: 13px; color: #6b7280;">
            If you have any questions, feel free to reply to this email.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
            This link is unique to you. Please don't share it with others.
          </p>
        </body>
      </html>
    `,
    text: `Hi ${recipientName},

We've prepared a proposal for you: ${proposalTitle}

View and sign the proposal here:
${fullPortalUrl}

If you have any questions, feel free to reply to this email.

This link is unique to you. Please don't share it with others.

${companyName}
`
  })

  if (error) {
    console.error('[sendProposalEmail] Error:', error)
    throw error
  }

  return data
}

export interface SendProposalSignedEmailParams {
  to: string
  recipientName: string
  proposalTitle: string
  portalUrl: string
}

export async function sendProposalSignedEmail({
  to,
  recipientName,
  proposalTitle,
  portalUrl
}: SendProposalSignedEmailParams) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    throw new Error('NEXT_PUBLIC_SITE_URL environment variable is required')
  }
  const fullPortalUrl = `${siteUrl}${portalUrl}`

  const { data, error } = await resend.emails.send({
    from: 'JARVE <proposals@jarve.com.au>',
    to,
    subject: `You're all set! ${proposalTitle} is signed`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 24px 0;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">JARVE</h1>
          </div>

          <div style="background: #f0fdf4; border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <div style="color: #16a34a; font-size: 32px; margin-bottom: 8px;">✓</div>
            <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #1a1a1a;">
              You're all set!
            </h2>
            <p style="margin: 0; color: #6b7280; font-size: 15px;">
              <strong>${proposalTitle}</strong> has been signed
            </p>
          </div>

          <p style="margin: 0 0 16px 0;">
            Hi ${recipientName},
          </p>

          <p style="margin: 0 0 16px 0;">
            Thanks for signing — we're excited to work with you! Your Client Portal is ready, and it's your home base for everything project-related:
          </p>

          <ul style="margin: 0 0 24px 0; padding-left: 0; list-style: none;">
            <li style="padding: 8px 0; display: flex; align-items: center;">
              <span style="color: #16a34a; margin-right: 12px;">✓</span>
              <span>Signed documents & contracts</span>
            </li>
            <li style="padding: 8px 0; display: flex; align-items: center;">
              <span style="color: #16a34a; margin-right: 12px;">✓</span>
              <span>Direct messaging with the team</span>
            </li>
            <li style="padding: 8px 0; display: flex; align-items: center;">
              <span style="color: #16a34a; margin-right: 12px;">✓</span>
              <span>File uploads & deliverables</span>
            </li>
          </ul>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${fullPortalUrl}" style="display: inline-block; background: #000000; color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Open Your Client Portal →
            </a>
          </div>

          <p style="margin: 24px 0 0 0; font-size: 13px; color: #6b7280; text-align: center;">
            Questions? Just reply to this email — we're here to help.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

          <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
            This link is unique to you. Please don't share it with others.
          </p>
        </body>
      </html>
    `,
    text: `JARVE

You're all set!
${proposalTitle} has been signed

Hi ${recipientName},

Thanks for signing — we're excited to work with you! Your Client Portal is ready, and it's your home base for everything project-related:

✓ Signed documents & contracts
✓ Direct messaging with the team
✓ File uploads & deliverables

Open your Client Portal:
${fullPortalUrl}

Questions? Just reply to this email — we're here to help.

This link is unique to you. Please don't share it with others.
`
  })

  if (error) {
    console.error('[sendProposalSignedEmail] Error:', error)
    throw error
  }

  return data
}
