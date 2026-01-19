export function BrandMark({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-2">
      <img src="/favicon.svg" alt="MobileTrade" className="h-9 w-9 rounded-full shadow-sm" />
      <div className="leading-tight">
        <div className="text-sm font-semibold">MobileTrade</div>
        {subtitle ? <div className="text-xs text-slate-500">{subtitle}</div> : null}
      </div>
    </div>
  )
}
