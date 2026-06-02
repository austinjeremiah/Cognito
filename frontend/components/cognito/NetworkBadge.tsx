interface NetworkBadgeProps {
  network: "testnet" | "mainnet"
  className?: string
}

export function NetworkBadge({ network, className = "" }: NetworkBadgeProps) {
  const isMainnet = network === "mainnet"

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
        ${isMainnet
          ? "bg-green-500/10 text-green-400 border border-green-500/20"
          : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
        } ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isMainnet ? "bg-green-400" : "bg-yellow-400"}`}
      />
      {isMainnet ? "Mainnet" : "Testnet"}
    </span>
  )
}
