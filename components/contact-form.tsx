'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

export function ContactForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setLoading(true)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const message = formData.get('message') as string

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message: message || null,
        }),
      })

      if (!res.ok) {
        if (res.status === 409) {
          alert('This email has already been submitted. We\'ll be in touch soon!')
          setLoading(false)
          return
        }
        throw new Error('Failed to submit')
      }
    } catch (err) {
      console.error('Error submitting form:', err)
      alert('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setLoading(false)
    setSuccess(true)
    form.reset()
    setTimeout(() => setSuccess(false), 5000)
  }

  return (
    <Card className="w-full border shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Project Description
            </label>
            <Input
              id="message"
              name="message"
              placeholder="What are you looking to build?"
            />
          </div>

          {success && (
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-200">
              Thanks for reaching out! I&apos;ll be in touch within 24 hours.
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full h-14 text-lg rounded-full bg-gradient-to-r from-green-600 to-emerald-500 text-white border-0 shadow-lg shadow-green-500/30 hover:shadow-green-500/40 hover:scale-[1.02] transition-all">
            {loading ? 'Sending...' : 'Book a Free Call'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
