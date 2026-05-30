import { Mastra } from '@mastra/core/mastra';
import { cognitoAgent } from './agent';

export const mastra = new Mastra({
  agents: { cognitoAgent },
});

export { cognitoAgent };
