/**
 * Ed25519Keypair.fromSecretKey in @mysten/sui v2 only accepts Bech32 strings (suiprivkey1...)
 * or raw 32-byte Uint8Array. This handles the common formats users export.
 */
export function parsePrivateKey(raw: string): string | Uint8Array {
  const trimmed = raw.trim();

  // Bech32 — pass directly
  if (trimmed.startsWith('suiprivkey1')) return trimmed;

  // Hex with 0x prefix (64 chars + prefix)
  if (/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed.slice(2), 'hex');
  }

  // Plain hex (64 chars)
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }

  // Base64 — two variants:
  // 32 bytes raw private key
  // 33 bytes = 1-byte scheme prefix (0x00 Ed25519) + 32-byte key (legacy Sui export format)
  try {
    const bytes = Buffer.from(trimmed, 'base64');
    if (bytes.length === 32) return bytes;
    if (bytes.length === 33) return bytes.slice(1); // strip scheme byte
  } catch {
    // not base64
  }

  // Return as-is and let SDK produce the error
  return trimmed;
}
