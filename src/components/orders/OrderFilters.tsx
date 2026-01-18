import { Badge } from '../ui/Badge'
import { Card, CardContent } from '../ui/Card'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { ORDER_STATUS_LABEL } from '../../lib/status'

export type OrderFilterState = {
  query: string
  status: 'all' | string
  maxDistanceKm: number
}

export function OrderFilters({
  value,
  onChange,
  withinCount,
  statusOptions,
}: {
  value: OrderFilterState
  onChange: (next: OrderFilterState) => void
  withinCount: number
  statusOptions?: Record<string, string>
}) {
  const options = statusOptions ?? ORDER_STATUS_LABEL
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold">Orders</div>
            <Badge className="bg-slate-100 text-slate-700 border-slate-200">{withinCount} within range</Badge>
          </div>

          <div className="flex-1" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
            <Input
              placeholder="Search by ID / customer"
              value={value.query}
              onChange={(e) => onChange({ ...value, query: e.target.value })}
            />

            <Select
              value={value.status}
              onChange={(e) => onChange({ ...value, status: e.target.value as any })}
            >
              <option value="all">All statuses</option>
              {Object.entries(options).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </Select>

            <Select
              value={String(value.maxDistanceKm)}
              onChange={(e) => onChange({ ...value, maxDistanceKm: Number(e.target.value) })}
            >
              {[1, 2, 5, 10, 20].map((km) => (
                <option key={km} value={km}>
                  Within {km} km
                </option>
              ))}
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
