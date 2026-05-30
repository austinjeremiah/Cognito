import { WalrusClient } from '@mysten/walrus';
import { ActionLog } from '../types/ActionLog';
import { WalrusWriteError } from '../types/errors';
import { withRetry } from '../utils/retry';
import { mainnetClient } from './TatumRPCService';
import logger from '../utils/logger';

export class WalrusService {
  private client: WalrusClient;

  constructor() {
    this.client = new WalrusClient({
      network: 'testnet',
      suiClient: mainnetClient,
    });
  }

  async writeBlob(data: Uint8Array, epochs = 10): Promise<string> {
    return withRetry(
      async () => {
        const result = await this.client.writeBlob({
          blob: data,
          deletable: false,
          epochs,
          signer: undefined as any,
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
