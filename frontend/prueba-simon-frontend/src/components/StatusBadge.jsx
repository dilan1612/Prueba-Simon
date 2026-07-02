import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getStatusConfig } from '@/lib/status'


export function StatusBadge({ status, className }) {
  const { label, icon: Icon, badgeClass } = getStatusConfig(status)

  return (
    <Badge variant="outline" className={cn(badgeClass, className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </Badge>
  )
}
