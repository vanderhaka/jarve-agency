import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { GripVertical, Trash2, Plus } from 'lucide-react'
import { ProposalSection } from '../../actions'

interface SectionsEditorProps {
  sections: ProposalSection[]
  canEdit: boolean
  onUpdateSection: (sectionId: string, updates: Partial<ProposalSection>) => void
  onRemoveSection: (sectionId: string) => void
}

export function SectionsEditor({
  sections,
  canEdit,
  onUpdateSection,
  onRemoveSection
}: SectionsEditorProps) {
  return (
    <>
      {sections
        .sort((a, b) => a.order - b.order)
        .map((section) => (
          <Card key={section.id}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                <Input
                  value={section.title}
                  onChange={(e) =>
                    onUpdateSection(section.id, { title: e.target.value })
                  }
                  className="font-semibold text-lg border-none p-0 h-auto focus-visible:ring-0"
                  disabled={!canEdit}
                />
              </div>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveSection(section.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {section.type === 'text' && (
                <Textarea
                  value={section.body || ''}
                  onChange={(e) =>
                    onUpdateSection(section.id, { body: e.target.value })
                  }
                  placeholder="Enter content..."
                  rows={4}
                  disabled={!canEdit}
                />
              )}
              {section.type === 'list' && (
                <div className="space-y-2">
                  {(section.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-muted-foreground">•</span>
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newItems = [...(section.items || [])]
                          newItems[idx] = e.target.value
                          onUpdateSection(section.id, { items: newItems })
                        }}
                        disabled={!canEdit}
                      />
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newItems = (section.items || []).filter(
                              (_, i) => i !== idx
                            )
                            onUpdateSection(section.id, { items: newItems })
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {canEdit && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => {
                        const newItems = [...(section.items || []), '']
                        onUpdateSection(section.id, { items: newItems })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Item
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
    </>
  )
}
