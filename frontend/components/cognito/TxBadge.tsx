"use client"

interface TxBadgeProps {
  digest: string
  label?: string
  className?: string
}

const SUIVISION_BASE =
  process.env.NEXT_PUBLIC_SUIVISION_BASE ?? "https://testnet.suivision.xyz"

export function TxBadge({ digest, label, className = "" }: TxBadgeProps) {
  const short = `${digest.slice(0, 6)}…${digest.slice(-4)}`
  const url = `${SUIVISION_BASE}/txblock/${digest}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono
        bg-green-500/10 text-green-400 border border-green-500/20
        hover:bg-green-500/20 transition-colors ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
      </span>
      {label ?? short}
    </a>
  )
}
