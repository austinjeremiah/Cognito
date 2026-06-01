import { WalrusClient } from '@mysten/walrus';
import { ActionLog } from '../types/ActionLog';
import { WalrusWriteError } from '../types/errors';
import { withRetry } from '../utils/retry';
import { config } from '../config';
import logger from '../utils/logger';

export class WalrusService {
  private client!: WalrusClient;
  private signer: any;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.initAsync();
  }

  private async initAsync(): Promise<void> {
    const { SuiMaster } = await import('suidouble');
    const suiMaster = new SuiMaster({
      client: 'testnet',
      privateKey: config.SUI_PRIVATE_KEY,
      debug: false,
    });
    await suiMaster.initialize();
    this.signer = suiMaster.signer;
    this.client = new WalrusClient({
      network: 'testnet',
      suiClient: suiMaster.client,
      storageNodeClientOptions: { timeout: 120000 },
      uploadRelay: {
        host: 'https://upload-relay.testnet.walrus.space',
        sendTip: { max: 1000 },
      },
    });
    logger.info('WalrusService initialized');
  }

  private async ensureReady(): Promise<void> {
    await this.initPromise;
  }

  async writeBlob(data: Uint8Array, epochs = 3): Promise<string> {
    await this.ensureReady();
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
      5,
      8000,
      'walrus-write'
    );
  }

  async readBlob(blobId: string): Promise<Uint8Array> {
    await this.ensureReady();
    return withRetry(
      async () => {
        const bytes = await this.client.readBlob({ blobId });
        logger.debug('Walrus blob read', { blobId, bytes: bytes.length });
        return bytes;
      },
      3,
      1000,
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
