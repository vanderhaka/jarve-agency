import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') ?? ''
  const description = searchParams.get('description') ?? ''

  // Homepage style (no params or explicit homepage params)
  const isHomepage = !title || title === 'JARVE'

  if (isHomepage) {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fafaf8',
            fontFamily: 'system-ui, sans-serif',
            position: 'relative',
          }}
        >
          {/* Grid pattern overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              opacity: 0.06,
              backgroundImage:
                'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />

          {/* Top nav bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px 48px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: 28,
                fontWeight: 800,
                color: '#1a1a1a',
                letterSpacing: '-0.02em',
              }}
            >
              JARVE
            </div>
            <div
              style={{
                display: 'flex',
                backgroundColor: '#3d5a3e',
                color: '#ffffff',
                padding: '10px 24px',
                borderRadius: '9999px',
                fontSize: 18,
                fontWeight: 500,
              }}
            >
              Request a Call
            </div>
          </div>

          {/* Hero content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                fontSize: 72,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
              }}
            >
              <span style={{ color: '#1a2e1a' }}>Your business has</span>
              <span style={{ color: '#4a7c4f' }}>outgrown spreadsheets.</span>
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 24,
                color: '#444444',
                fontWeight: 400,
              }}
            >
              Custom web apps & internal tools. Fixed price. Launched in weeks.
            </div>
          </div>

          {/* jarve.com.au */}
          <div
            style={{
              position: 'absolute',
              bottom: '36px',
              display: 'flex',
              fontSize: 20,
              color: '#888888',
              fontWeight: 400,
            }}
          >
            jarve.com.au
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }

  // Dynamic page style (services, industries, etc.)
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 80px',
          backgroundColor: '#fafaf8',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            opacity: 0.06,
            backgroundImage:
              'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: '#1a2e1a',
              lineHeight: 1.2,
              maxWidth: '900px',
              letterSpacing: '-0.03em',
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                fontSize: 26,
                color: '#555555',
                lineHeight: 1.4,
                maxWidth: '800px',
              }}
            >
              {description}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            position: 'absolute',
            bottom: '48px',
            left: '80px',
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#1a1a1a',
              letterSpacing: '-0.02em',
            }}
          >
            JARVE
          </div>
          <div
            style={{
              fontSize: 20,
              color: '#888888',
              fontWeight: 400,
            }}
          >
            jarve.com.au
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
