import Link from 'next/link'
import { SignOutButton } from './sign-out-button'

export default function RevokedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-lg space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Access revoked</h1>
          <p className="text-muted-foreground">
            Your account no longer has access to this workspace. Please contact an administrator if you believe this is a mistake.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <SignOutButton />
          <Link href="/login" className="text-sm text-muted-foreground underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
