import { PackageSearch } from 'lucide-react'

export function BrandMark({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-9 w-9 rounded-xl bg-brand-600 text-white grid place-items-center shadow-sm">
        <PackageSearch className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold">Reprise Logistics</div>
        {subtitle ? <div className="text-xs text-slate-500">{subtitle}</div> : null}
      </div>
    </div>
  )
}
