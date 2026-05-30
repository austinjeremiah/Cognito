import { mainnetClient } from './TatumRPCService';
import { WalrusService } from './WalrusService';
import { SuiSQLService } from './SuiSQLService';
import logger from '../utils/logger';

export interface VerifyProof {
  actionId: string;
  status: 'verified' | 'tampered' | 'unanchored';
  steps: {
    blobFetched: boolean;
    hashMatchesBlobId: boolean;
    onChainEventFound: boolean;
    onChainBlobIdMatches: boolean;
  };
  recomputedBlobId?: string;
  onChainBlobId?: string;
  mainnetTxDigest?: string;
  suiVisionUrl?: string;
}

export class VerifyService {
  constructor(
    private walrus: WalrusService,
    private suisql: SuiSQLService,
  ) {}

  async verifyAction(actionId: string): Promise<VerifyProof> {
    const action = await this.suisql.getAction(actionId);

    if (!action?.blobId) {
      return {
        actionId,
        status: 'unanchored',
        steps: { blobFetched: false, hashMatchesBlobId: false, onChainEventFound: false, onChainBlobIdMatches: false },
      };
    }

    // Step 1+2: re-fetch blob and recompute blob ID from raw bytes
    let bytes: Uint8Array;
    let recomputedBlobId: string;
    try {
      bytes = await this.walrus.readBlob(action.blobId);
      recomputedBlobId = await this.walrus.computeBlobId(bytes);
    } catch {
      return {
        actionId,
        status: 'tampered',
        steps: { blobFetched: false, hashMatchesBlobId: false, onChainEventFound: false, onChainBlobIdMatches: false },
      };
    }

    const hashMatchesBlobId = recomputedBlobId === action.blobId;

    // Step 3+4: query SessionAnchored event from mainnet tx
    const session = await this.suisql.getSession(action.sessionId);
    let onChainEventFound = false;
    let onChainBlobIdMatches = false;
    let onChainBlobId: string | undefined;

    if (session?.mainnetTxDigest) {
      try {
        const tx = await (mainnetClient as any).getTransactionBlock({
          digest: session.mainnetTxDigest,
          options: { showEvents: true },
        });

        const event = tx.events?.find((e: any) =>
          e.type?.includes('::agent_ledger::SessionAnchored')
        );

        if (event) {
          onChainEventFound = true;
          onChainBlobId = (event.parsedJson as any)?.blob_id;
          onChainBlobIdMatches = onChainBlobId === action.blobId;
        }
      } catch (err) {
        logger.warn('Failed to fetch mainnet tx for verification', { digest: session.mainnetTxDigest, error: (err as Error).message });
      }
    }

    const allPassed = hashMatchesBlobId && onChainEventFound && onChainBlobIdMatches;

    return {
      actionId,
      status: allPassed ? 'verified' : 'tampered',
      steps: { blobFetched: true, hashMatchesBlobId, onChainEventFound, onChainBlobIdMatches },
      recomputedBlobId,
      onChainBlobId,
      mainnetTxDigest: session?.mainnetTxDigest,
      suiVisionUrl: session?.mainnetTxDigest
        ? `https://suivision.xyz/txblock/${session.mainnetTxDigest}`
        : undefined,
    };
  }
}
