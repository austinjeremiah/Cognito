import { WalrusClient } from '@mysten/walrus';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { ActionLog } from '../types/ActionLog';
import { WalrusWriteError } from '../types/errors';
import { withRetry } from '../utils/retry';
import { mainnetClient } from './TatumRPCService';
import { parsePrivateKey } from '../utils/parsePrivateKey';
import { config } from '../config';
import logger from '../utils/logger';

export class WalrusService {
  private client: WalrusClient;
  private signer: Ed25519Keypair;

  constructor() {
    this.signer = Ed25519Keypair.fromSecretKey(parsePrivateKey(config.SUI_PRIVATE_KEY) as any);
    this.client = new WalrusClient({
      network: 'testnet',
      suiClient: mainnetClient as any,
    });
  }

  async writeBlob(data: Uint8Array, epochs = 10): Promise<string> {
    return withRetry(
      async () => {
        const result = await this.client.writeBlob({
          blob: data,
          deletable: false,
          epochs,
          signer: this.signer,
        });
        logger.info('Walrus blob written', { blobId: result.blobId });
        return result.blobId;
      },
      3,
      1000,
      'walrus-write'
    );
  }

  async readBlob(blobId: string): Promise<Uint8Array> {
    return withRetry(
      async () => {
        const bytes = await this.client.readBlob({ blobId });
        logger.debug('Walrus blob read', { blobId, bytes: bytes.length });
        return bytes;
      },
      3,
      500,
      'walrus-read'
    );
  }

  async writeBatch(entries: ActionLog[]): Promise<string> {
    try {
      const payload = JSON.stringify(entries);
      const bytes = new TextEncoder().encode(payload);
      return await this.writeBlob(bytes);
    } catch (err) {
      throw new WalrusWriteError(`Batch write failed: ${(err as Error).message}`);
    }
  }

  async computeBlobId(bytes: Uint8Array): Promise<string> {
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
