"use client"

interface BlobLinkProps {
  blobId: string
  className?: string
}

const WALRUS_AGGREGATOR =
  process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR ?? "https://aggregator.walrus-testnet.walrus.space"

export function BlobLink({ blobId, className = "" }: BlobLinkProps) {
  const short = `${blobId.slice(0, 8)}…${blobId.slice(-4)}`
  const url = `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono
        bg-blue-500/10 text-blue-400 border border-blue-500/20
        hover:bg-blue-500/20 transition-colors ${className}`}
    >
      <svg className="w-3 h-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      {short}
    </a>
  )
}
