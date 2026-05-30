import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { config } from '../config';
import { mainnetClient } from './TatumRPCService';
import { SuiTxError } from '../types/errors';
import { AnchorResult } from '../types/SuiTypes';
import logger from '../utils/logger';

export class SuiAnchorService {
  private keypair: Ed25519Keypair;

  constructor() {
    this.keypair = Ed25519Keypair.fromSecretKey(config.SUI_PRIVATE_KEY);
  }

  async anchorSession(params: {
    sessionId: string;
    agentId: string;
    agentName: string;
    actionCount: number;
    blobId: string;
    suisqlObjectId: string;
  }): Promise<AnchorResult> {
    if (!config.COGNITO_PACKAGE_ID) {
      throw new SuiTxError('COGNITO_PACKAGE_ID not set — deploy Move contract first');
    }

    const tx = new Transaction();

    tx.moveCall({
      target: `${config.COGNITO_PACKAGE_ID}::${config.COGNITO_MODULE}::anchor_session`,
      arguments: [
        tx.pure.string(params.sessionId),
        tx.pure.string(params.agentId),
        tx.pure.string(params.agentName),
        tx.pure.u64(params.actionCount),
        tx.pure.string(params.blobId),
        tx.pure.address(params.suisqlObjectId),
      ],
    });

    try {
      const txBytes = await tx.build({ client: mainnetClient as any });
      const { signature } = await this.keypair.signTransaction(txBytes);

      const result = await (mainnetClient as any).executeTransactionBlock({
        transactionBlock: Buffer.from(txBytes).toString('base64'),
        signature,
        options: { showEvents: true, showEffects: true },
      });

      const digest: string = result.digest;
      const suiVisionUrl = `https://suivision.xyz/txblock/${digest}`;

      logger.info('Session anchored on mainnet', { digest, sessionId: params.sessionId });

      return { txDigest: digest, suiVisionUrl };
    } catch (err) {
      throw new SuiTxError(`Mainnet anchor failed: ${(err as Error).message}`);
    }
  }
}
