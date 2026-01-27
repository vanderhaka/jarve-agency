import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2 } from 'lucide-react'
import { PricingLineItem } from '../../actions'

interface PricingEditorProps {
  lineItems: PricingLineItem[]
  subtotal: number
  gstRate: number
  gstAmount: number
  total: number
  canEdit: boolean
  onAddLineItem: () => void
  onUpdateLineItem: (itemId: string, updates: Partial<PricingLineItem>) => void
  onRemoveLineItem: (itemId: string) => void
}

export function PricingEditor({
  lineItems,
  subtotal,
  gstRate,
  gstAmount,
  total,
  canEdit,
  onAddLineItem,
  onUpdateLineItem,
  onRemoveLineItem
}: PricingEditorProps) {
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Description</TableHead>
            <TableHead className="w-[15%]">Qty</TableHead>
            <TableHead className="w-[20%]">Unit Price</TableHead>
            <TableHead className="w-[20%]">Total</TableHead>
            <TableHead className="w-[5%]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Input
                  value={item.label}
                  onChange={(e) =>
                    onUpdateLineItem(item.id, { label: e.target.value })
                  }
                  placeholder="Line item description"
                  disabled={!canEdit}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.qty}
                  onChange={(e) =>
                    onUpdateLineItem(item.id, {
                      qty: parseFloat(e.target.value) || 0
                    })
                  }
                  min="0"
                  disabled={!canEdit}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) =>
                    onUpdateLineItem(item.id, {
                      unitPrice: parseFloat(e.target.value) || 0
                    })
                  }
                  min="0"
                  step="0.01"
                  disabled={!canEdit}
                />
              </TableCell>
              <TableCell className="font-medium">
                ${item.total.toFixed(2)}
              </TableCell>
              <TableCell>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveLineItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {canEdit && (
        <Button variant="success" size="sm" onClick={onAddLineItem}>
          <Plus className="h-4 w-4 mr-2" /> Add Line Item
        </Button>
      )}
      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>GST ({(gstRate * 100).toFixed(0)}%):</span>
            <span>${gstAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
