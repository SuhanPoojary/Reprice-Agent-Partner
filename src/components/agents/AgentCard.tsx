import { Phone, User } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { AGENT_STATUS_BADGE, AGENT_STATUS_LABEL, type AgentLiveStatus } from '../../lib/status'
import type { Agent } from '../../mock/types'

export function AgentCard({
  agent,
  onEdit,
  onRemove,
  onSetStatus,
}: {
  agent: Agent
  onEdit: () => void
  onRemove: () => void
  onSetStatus: (s: AgentLiveStatus) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <User className="h-4 w-4 text-slate-600" /> {agent.name}
          </span>
          <Badge className={AGENT_STATUS_BADGE[agent.liveStatus]}>{AGENT_STATUS_LABEL[agent.liveStatus]}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-slate-700 inline-flex items-center gap-2">
          <Phone className="h-4 w-4 text-slate-500" /> {agent.phone}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={onRemove}>
            Remove
          </Button>

          <div className="flex-1" />

          <Button variant="ghost" size="sm" onClick={() => onSetStatus('pending')}>
            Pending
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onSetStatus('on_the_way')}>
            On the way
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onSetStatus('picked')}>
            Picked
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onSetStatus('completed')}>
            Completed
          </Button>
        </div>

        <div className="mt-3 text-xs text-slate-500">Last seen: {new Date(agent.lastSeenAt).toLocaleString()}</div>
      </CardContent>
    </Card>
  )
}
