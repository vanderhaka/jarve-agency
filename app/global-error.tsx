'use client'

import { useEffect } from 'react'

const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to console for debugging (including on iPad via Safari Web Inspector)
    console.error('Global error caught:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      name: error.name,
    })
  }, [error])

  const displayMessage = error.message || DEFAULT_ERROR_MESSAGE

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              {displayMessage}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-400 mb-4 font-mono">
                Error ID: {error.digest}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => reset()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Go home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && error.stack && (
              <pre className="mt-4 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-48 text-red-600">
                {error.stack}
              </pre>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
