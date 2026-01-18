import { useMemo, useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function AgentForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: { id?: string; name: string; phone: string }
  onSubmit: (v: { id: string; name: string; phone: string }) => void
  onCancel: () => void
}) {
  const defaultId = useMemo(() => initial?.id ?? `agent-${Math.floor(Math.random() * 9000 + 1000)}`,[initial?.id])
  const [name, setName] = useState(initial?.name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ id: defaultId, name: name.trim(), phone: phone.trim() })
      }}
    >
      <div className="text-xs text-slate-500">Agent ID: {defaultId}</div>
      <div>
        <div className="text-sm font-medium text-slate-700">Name</div>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Agent name" required />
      </div>
      <div>
        <div className="text-sm font-medium text-slate-700">Phone</div>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 ..." required />
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={!name.trim() || !phone.trim()}>
          Save
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
