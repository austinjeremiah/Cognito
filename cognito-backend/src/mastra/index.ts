import { Mastra } from '@mastra/core/mastra';
import { cognitoAgent, auditAgent1, auditAgent2, demoAgent } from './agent';

export const mastra = new Mastra({
  agents: { cognitoAgent, auditAgent1, auditAgent2, demoAgent },
});

export { cognitoAgent, auditAgent1, auditAgent2, demoAgent };
