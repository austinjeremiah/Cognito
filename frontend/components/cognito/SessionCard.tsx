import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { SessionStatus } from "./SessionStatus"
import { TxBadge } from "./TxBadge"
import { BlobLink } from "./BlobLink"
import type { Session } from "@/app/types"

interface SessionCardProps {
  session: Session
}

export function SessionCard({ session }: SessionCardProps) {
  const status = session.mainnetTxDigest ? "anchored" : session.endedAt ? "pending" : "active"
  const timeAgo = formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/60 hover:border-border transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-mono text-muted-foreground truncate">
              {session.id}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Started {timeAgo}</p>
          </div>
          <SessionStatus status={status} className="shrink-0" />
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            <span className="font-mono text-foreground">{session.actionCount}</span> actions
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {session.blobId && <BlobLink blobId={session.blobId} />}
          {session.mainnetTxDigest && <TxBadge digest={session.mainnetTxDigest} label="Anchor tx" />}
        </div>

        <Link
          href={`/sessions/${session.id}`}
          className="block text-center text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted/50 transition-colors text-foreground"
        >
          View Session + Verify
        </Link>
      </CardContent>
    </Card>
  )
}
