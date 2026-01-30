import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') ?? 'Jarve'
  const description = searchParams.get('description') ?? ''

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
          backgroundColor: '#0a0a0a',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
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
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.2,
              maxWidth: '900px',
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                fontSize: 28,
                color: '#a1a1aa',
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
            gap: '12px',
            position: 'absolute',
            bottom: '60px',
            left: '80px',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#22c55e',
            }}
          />
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: '#ffffff',
            }}
          >
            Jarve
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
