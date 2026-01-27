import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, FileText, History } from 'lucide-react'
import { ProposalContent, ProposalSection } from '../../actions'
import { SectionsEditor } from './sections-editor'
import { PricingEditor } from './pricing-editor'
import { VersionHistory } from './version-history'
import { UseProposalFormReturn } from '../hooks/use-proposal-form'

interface ProposalVersion {
  id: string
  version: number
  content: unknown
  subtotal: number
  gst_rate: number
  gst_amount: number
  total: number
  sent_at: string | null
  created_at: string
  created_by_employee?: { name: string }
}

interface ProposalEditorProps {
  content: ProposalContent
  versions: ProposalVersion[]
  currentVersion: number
  canEdit: boolean
  formActions: UseProposalFormReturn
}

export function ProposalEditor({
  content,
  versions,
  currentVersion,
  canEdit,
  formActions
}: ProposalEditorProps) {
  const {
    updateSection,
    addSection,
    removeSection,
    addLineItem,
    updateLineItem,
    removeLineItem,
    updateTerms
  } = formActions

  // Separate sections by type
  const textAndListSections = content.sections.filter(s => s.type !== 'pricing')
  const pricingSection = content.sections.find(s => s.type === 'pricing')

  return (
    <Tabs defaultValue="content">
      <TabsList>
        <TabsTrigger value="content" className="gap-2">
          <FileText className="h-4 w-4" /> Content
        </TabsTrigger>
        <TabsTrigger value="versions" className="gap-2">
          <History className="h-4 w-4" /> Versions ({versions.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="content" className="mt-6 space-y-6">
        {/* Text and List Sections */}
        <SectionsEditor
          sections={textAndListSections}
          canEdit={canEdit}
          onUpdateSection={updateSection}
          onRemoveSection={removeSection}
        />

        {/* Pricing Section */}
        {pricingSection && (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <CardTitle>{pricingSection.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <PricingEditor
                lineItems={content.pricing.lineItems}
                subtotal={content.pricing.subtotal}
                gstRate={content.pricing.gstRate}
                gstAmount={content.pricing.gstAmount}
                total={content.pricing.total}
                canEdit={canEdit}
                onAddLineItem={addLineItem}
                onUpdateLineItem={updateLineItem}
                onRemoveLineItem={removeLineItem}
              />
            </CardContent>
          </Card>
        )}

        {/* Add Section */}
        {canEdit && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex gap-2 justify-center">
                <Button variant="success" onClick={() => addSection('text')}>
                  <Plus className="h-4 w-4 mr-2" /> Text Section
                </Button>
                <Button variant="success" onClick={() => addSection('list')}>
                  <Plus className="h-4 w-4 mr-2" /> List Section
                </Button>
                {!content.sections.some((s) => s.type === 'pricing') && (
                  <Button variant="success" onClick={() => addSection('pricing')}>
                    <Plus className="h-4 w-4 mr-2" /> Pricing Section
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={content.terms}
              onChange={(e) => updateTerms(e.target.value)}
              placeholder="Enter payment terms, conditions, and other legal text..."
              rows={6}
              disabled={!canEdit}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="versions" className="mt-6">
        <VersionHistory versions={versions} currentVersion={currentVersion} />
      </TabsContent>
    </Tabs>
  )
}
