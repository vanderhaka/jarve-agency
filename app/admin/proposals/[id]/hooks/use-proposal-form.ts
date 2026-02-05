import { useState, useCallback } from 'react'
import type { ProposalSection, PricingLineItem, ProposalContent } from '../../actions'

export interface UseProposalFormReturn {
  content: ProposalContent | null
  hasChanges: boolean
  setContent: (content: ProposalContent) => void
  updateSection: (sectionId: string, updates: Partial<ProposalSection>) => void
  addSection: (type: ProposalSection['type']) => void
  removeSection: (sectionId: string) => void
  addLineItem: () => void
  updateLineItem: (itemId: string, updates: Partial<PricingLineItem>) => void
  removeLineItem: (itemId: string) => void
  updateTerms: (terms: string) => void
  resetChanges: () => void
}

export function useProposalForm(initialContent: ProposalContent | null): UseProposalFormReturn {
  const [content, setContentState] = useState<ProposalContent | null>(initialContent)
  const [hasChanges, setHasChanges] = useState(false)

  const setContent = useCallback((newContent: ProposalContent) => {
    setContentState(newContent)
  }, [])

  const updateSection = useCallback((sectionId: string, updates: Partial<ProposalSection>) => {
    setContentState(prev => {
      if (!prev) return prev
      return {
        ...prev,
        sections: prev.sections.map(s =>
          s.id === sectionId ? { ...s, ...updates } : s
        )
      }
    })
    setHasChanges(true)
  }, [])

  const addSection = useCallback((type: ProposalSection['type']) => {
    setContentState(prev => {
      if (!prev) return prev
      const newSection: ProposalSection = {
        id: `section_${Date.now()}`,
        type,
        title: type === 'pricing' ? 'Investment' : 'New Section',
        body: '',
        items: type === 'list' ? [] : undefined,
        order: prev.sections.length + 1
      }
      return {
        ...prev,
        sections: [...prev.sections, newSection]
      }
    })
    setHasChanges(true)
  }, [])

  const removeSection = useCallback((sectionId: string) => {
    setContentState(prev => {
      if (!prev) return prev
      return {
        ...prev,
        sections: prev.sections.filter(s => s.id !== sectionId)
      }
    })
    setHasChanges(true)
  }, [])

  const updatePricing = useCallback((lineItems: PricingLineItem[]) => {
    setContentState(prev => {
      if (!prev) return prev
      const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
      const gstAmount = subtotal * prev.pricing.gstRate
      const total = subtotal + gstAmount

      return {
        ...prev,
        pricing: {
          ...prev.pricing,
          lineItems,
          subtotal,
          gstAmount,
          total
        }
      }
    })
    setHasChanges(true)
  }, [])

  const addLineItem = useCallback(() => {
    setContentState(prev => {
      if (!prev) return prev
      const newItem: PricingLineItem = {
        id: crypto.randomUUID(),
        label: '',
        qty: 1,
        unitPrice: 0,
        total: 0
      }
      const newLineItems = [...prev.pricing.lineItems, newItem]

      const subtotal = newLineItems.reduce((sum, item) => sum + item.total, 0)
      const gstAmount = subtotal * prev.pricing.gstRate
      const total = subtotal + gstAmount

      return {
        ...prev,
        pricing: {
          ...prev.pricing,
          lineItems: newLineItems,
          subtotal,
          gstAmount,
          total
        }
      }
    })
    setHasChanges(true)
  }, [])

  const updateLineItem = useCallback((itemId: string, updates: Partial<PricingLineItem>) => {
    setContentState(prev => {
      if (!prev) return prev
      const newLineItems = prev.pricing.lineItems.map(item => {
        if (item.id === itemId) {
          const updated = { ...item, ...updates }
          updated.total = updated.qty * updated.unitPrice
          return updated
        }
        return item
      })

      const subtotal = newLineItems.reduce((sum, item) => sum + item.total, 0)
      const gstAmount = subtotal * prev.pricing.gstRate
      const total = subtotal + gstAmount

      return {
        ...prev,
        pricing: {
          ...prev.pricing,
          lineItems: newLineItems,
          subtotal,
          gstAmount,
          total
        }
      }
    })
    setHasChanges(true)
  }, [])

  const removeLineItem = useCallback((itemId: string) => {
    setContentState(prev => {
      if (!prev) return prev
      const newLineItems = prev.pricing.lineItems.filter(i => i.id !== itemId)

      const subtotal = newLineItems.reduce((sum, item) => sum + item.total, 0)
      const gstAmount = subtotal * prev.pricing.gstRate
      const total = subtotal + gstAmount

      return {
        ...prev,
        pricing: {
          ...prev.pricing,
          lineItems: newLineItems,
          subtotal,
          gstAmount,
          total
        }
      }
    })
    setHasChanges(true)
  }, [])

  const updateTerms = useCallback((terms: string) => {
    setContentState(prev => {
      if (!prev) return prev
      return { ...prev, terms }
    })
    setHasChanges(true)
  }, [])

  const resetChanges = useCallback(() => {
    setHasChanges(false)
  }, [])

  return {
    content,
    hasChanges,
    setContent,
    updateSection,
    addSection,
    removeSection,
    addLineItem,
    updateLineItem,
    removeLineItem,
    updateTerms,
    resetChanges
  }
}
