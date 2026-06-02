import { formatDistanceToNow } from "date-fns"
import { ActionTypeIcon } from "./ActionTypeIcon"
import { BlobLink } from "./BlobLink"
import type { ActionLog } from "@/app/types"

interface ActionEntryProps {
  action: ActionLog
  onSelect?: (action: ActionLog) => void
}

function tryParseJson(str: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(str)
    if (typeof parsed === "object" && parsed !== null) return parsed
  } catch {}
  return null
}

function DescriptionCell({ description }: { description: string }) {
  const parsed = tryParseJson(description)
  if (parsed) {
    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(parsed).map(([k, v]) => (
          <span key={k} className="text-xs font-mono bg-muted/60 px-1.5 py-0.5 rounded text-muted-foreground">
            <span className="text-foreground">{k}</span>: {String(v)}
          </span>
        ))}
      </div>
    )
  }
  return <span className="text-sm text-foreground truncate">{description}</span>
}

export function ActionEntry({ action, onSelect }: ActionEntryProps) {
  return (
    <div
      className={`px-4 py-3 flex items-start gap-3 flex-wrap hover:bg-muted/30 transition-colors ${onSelect ? "cursor-pointer" : ""}`}
      onClick={() => onSelect?.(action)}
    >
      <div className="mt-0.5 shrink-0">
        <ActionTypeIcon type={action.actionType} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <DescriptionCell description={action.description} />
        <p className="text-xs text-muted-foreground font-mono">
          {action.id.slice(0, 8)}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-auto shrink-0">
        {action.blobId && <BlobLink blobId={action.blobId} />}
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(action.ts), { addSuffix: true })}
        </span>
      </div>
    </div>
  )
}
