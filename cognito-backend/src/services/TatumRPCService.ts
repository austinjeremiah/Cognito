import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { JsonRpcHTTPTransport } from '@mysten/sui/jsonRpc';
import { config } from '../config';

export function createSuiClient(network: 'mainnet' | 'testnet'): SuiJsonRpcClient {
  const url =
    network === 'mainnet'
      ? config.TATUM_SUI_RPC_URL
      : config.TATUM_SUI_TESTNET_RPC_URL;

  const apiKey =
    network === 'mainnet'
      ? config.TATUM_MAINNET_API_KEY
      : config.TATUM_TESTNET_API_KEY;

  const transport = new JsonRpcHTTPTransport({
    url,
    rpc: {
      headers: { 'x-api-key': apiKey },
    },
  });

  return new SuiJsonRpcClient({ transport, network });
}

export const mainnetClient = createSuiClient('mainnet');
export const testnetClient = createSuiClient('testnet');
