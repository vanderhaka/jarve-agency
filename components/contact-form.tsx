'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PROJECT_TYPES = [
  { value: 'web_app', label: 'Web Application' },
  { value: 'mobile_app', label: 'Mobile App' },
  { value: 'automation', label: 'Automation / Workflows' },
  { value: 'ai_integration', label: 'AI Integration' },
  { value: 'other', label: 'Other' },
]

const BUDGET_RANGES = [
  { value: 'under_5k', label: 'Under $5,000' },
  { value: '5k_15k', label: '$5,000 - $15,000' },
  { value: '15k_50k', label: '$15,000 - $50,000' },
  { value: 'over_50k', label: '$50,000+' },
]

const TIMELINES = [
  { value: 'asap', label: 'ASAP' },
  { value: '1_3_months', label: '1-3 months' },
  { value: '3_6_months', label: '3-6 months' },
  { value: 'exploring', label: 'Just exploring' },
]

export function ContactForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [projectType, setProjectType] = useState('')
  const [budget, setBudget] = useState('')
  const [timeline, setTimeline] = useState('')
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setLoading(true)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const company = formData.get('company') as string
    const message = formData.get('message') as string

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          company: company || null,
          project_type: projectType || null,
          budget: budget || null,
          timeline: timeline || null,
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
    setProjectType('')
    setBudget('')
    setTimeline('')
    form.reset()
    setTimeout(() => setSuccess(false), 5000)
  }

  return (
    <Card className="w-full border shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Name & Email */}
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

          {/* Row 2: Company & Project Type */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium">
                Company <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <Input
                id="company"
                name="company"
                placeholder="Your company"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Project Type <span className="text-red-500">*</span>
              </label>
              <Select value={projectType} onValueChange={setProjectType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Budget & Timeline */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Budget Range <span className="text-red-500">*</span>
              </label>
              <Select value={budget} onValueChange={setBudget} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Timeline <span className="text-red-500">*</span>
              </label>
              <Select value={timeline} onValueChange={setTimeline} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Project Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="message"
              name="message"
              required
              placeholder="Tell me about your project, goals, and any specific requirements..."
              rows={5}
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
