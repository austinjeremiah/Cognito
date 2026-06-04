import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireApiKey } from '../middleware/auth';
import { config } from '../config';
import logger from '../utils/logger';

const bodySchema = z.object({
  actions: z.array(z.object({
    id:          z.string(),
    actionType:  z.string(),
    description: z.string(),
    ts:          z.number(),
    blobId:      z.string().optional(),
    parentActionId: z.string().optional(),
  })).min(1),
  question:         z.string().min(1).max(500),
  nodeId:           z.string().optional(),
  walrusAggregator: z.string().optional(),
  memories:         z.array(z.string()).optional(),
  blobContent:      z.array(z.record(z.unknown())).optional(),
});

export async function explainRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/explain', { preHandler: requireApiKey }, async (req, reply) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.errors.map((e) => e.message).join(', ') });
    }

    const { actions, question, nodeId, walrusAggregator, memories, blobContent } = parsed.data;
    const aggregator = walrusAggregator ?? 'https://aggregator.walrus-testnet.walrus.space';

    // Build action log with blob URLs
    const actionLog = actions
      .map((a, i) => {
        const blobUrl = a.blobId ? `${aggregator}/v1/blobs/${a.blobId}` : null;
        return `[${i + 1}] ${a.actionType.toUpperCase()} — ${a.description}${
          a.parentActionId ? ` (parent: ${a.parentActionId.slice(0, 8)})` : ''
        }${blobUrl ? `\n    Walrus blob: ${blobUrl}` : ''}`;
      })
      .join('\n');

    const focusedNode = nodeId ? actions.find((a) => a.id === nodeId) : null;
    const nodeContext = focusedNode
      ? `\nThe user clicked on this specific action:\nType: ${focusedNode.actionType}\nDescription: ${focusedNode.description}${
          focusedNode.blobId ? `\nWalrus blob: ${aggregator}/v1/blobs/${focusedNode.blobId}` : ''
        }\n`
      : '';

    const memoryContext = memories && memories.length > 0
      ? `\nRelevant MemWal semantic memories for this session:\n${memories.map((m) => `- ${m}`).join('\n')}\n`
      : '';

    const blobContext = blobContent && blobContent.length > 0
      ? `\nWalrus blob raw content (${blobContent.length} actions — this is what the blob actually stores):\n${JSON.stringify(blobContent, null, 2)}\n`
      : '';

    const systemPrompt = `You are Cognito AI — an expert assistant helping users understand AI agent audit trails. Cognito logs every agent action tamper-proof to Walrus and anchors sessions on Sui blockchain.

You have full context of an agent session with ${actions.length} logged actions:

${actionLog}
${nodeContext}${memoryContext}${blobContext}
Guidelines:
- When referencing a Walrus blob, format it as a markdown link: [View blob](url)
- Reference action numbers like [1], [3] when relevant
- Be concise — 3-5 sentences max unless asked for more detail
- For security findings, be specific about risk level and impact
- If blob content is provided, summarize it in plain English — never show raw JSON to the user
- If asked about MemWal memories, summarize what past context was recalled
- Present blob data as: agent name, action count, findings, score — not as JSON`;

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${config.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: question },
          ],
          max_tokens: 500,
          temperature: 0.35,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        logger.error('Groq explain failed', { status: res.status, err });
        return reply.status(502).send({ error: 'AI service unavailable' });
      }

      const data = await res.json() as { choices: { message: { content: string } }[] };
      const answer = data.choices?.[0]?.message?.content ?? 'No response generated.';

      logger.info('Explain request completed', { actionCount: actions.length, question: question.slice(0, 50) });
      return reply.send({ answer });

    } catch (err) {
      logger.error('Explain route error', { error: (err as Error).message });
      return reply.status(500).send({ error: 'Failed to generate explanation' });
    }
  });
}
