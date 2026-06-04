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
    parentActionId: z.string().optional(),
  })).min(1),
  question: z.string().min(1).max(500),
  nodeId:   z.string().optional(),
});

export async function explainRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/explain', { preHandler: requireApiKey }, async (req, reply) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.errors.map((e) => e.message).join(', ') });
    }

    const { actions, question, nodeId } = parsed.data;

    const actionLog = actions
      .map((a, i) => `[${i + 1}] ${a.actionType.toUpperCase()} — ${a.description}${a.parentActionId ? ` (parent: ${a.parentActionId.slice(0, 8)})` : ''}`)
      .join('\n');

    const focusedNode = nodeId ? actions.find((a) => a.id === nodeId) : null;
    const nodeContext = focusedNode
      ? `\nThe user is focused on this specific action:\nType: ${focusedNode.actionType}\nDescription: ${focusedNode.description}\n`
      : '';

    const systemPrompt = `You are an AI assistant helping users understand AI agent audit trails logged by Cognito — a tamper-proof agent accountability system built on Walrus and Sui.

You have full context of an agent session with ${actions.length} logged actions:

${actionLog}
${nodeContext}
Answer questions about this agent's behavior, decisions, and reasoning. Be concise and insightful. Reference specific action numbers when relevant. If asked about security findings or risks, prioritize those.`;

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
          max_tokens: 400,
          temperature: 0.4,
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
