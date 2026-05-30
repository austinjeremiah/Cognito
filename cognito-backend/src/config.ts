import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  // Tatum
  TATUM_MAINNET_API_KEY: z.string().min(1),
  TATUM_TESTNET_API_KEY: z.string().min(1),
  TATUM_SUI_RPC_URL: z.string().url(),
  TATUM_SUI_TESTNET_RPC_URL: z.string().url(),

  // Sui keypair
  SUI_PRIVATE_KEY: z.string().min(1),
  SUI_ADDRESS: z.string().min(1),

  // Walrus
  WALRUS_PUBLISHER_URL: z.string().url(),
  WALRUS_AGGREGATOR_URL: z.string().url(),

  // SuiSQL
  SUISQL_NETWORK: z.enum(['testnet', 'mainnet']).default('testnet'),
  SUISQL_DB_OBJECT_ID: z.string().optional(),

  // Move contract
  COGNITO_PACKAGE_ID: z.string().optional(),
  COGNITO_MODULE: z.string().default('agent_ledger'),

  // Redis
  REDIS_URL: z.string().url(),

  // App
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // API auth
  COGNITO_API_KEY: z.string().min(1),

  // Groq
  GROQ_API_KEY: z.string().min(1),
  GROQ_MODEL: z.string().default('groq/llama-3.1-8b-instant'),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
