import { FastifyInstance } from 'fastify';
import { requireApiKey } from '../middleware/auth';
import { suiSql, cache } from '../services/container';
import { ActionLog } from '../types/ActionLog';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  ts: number;
  blobId?: string;
  anchored: boolean;
}

interface GraphEdge {
  source: string;
  target: string;
}

function buildGraph(actions: ActionLog[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = actions.map((a) => ({
    id: a.id,
    label: a.description.slice(0, 60),
    type: a.actionType,
    ts: a.ts,
    blobId: a.blobId,
    anchored: !!a.blobId,
  }));

  const edges: GraphEdge[] = [];
  for (const action of actions) {
    if (action.parentActionId) {
      edges.push({ source: action.parentActionId, target: action.id });
    }
    const extra = (action.metadata?.additionalParents as string[] | undefined) ?? [];
    for (const parentId of extra) {
      edges.push({ source: parentId, target: action.id });
    }
  }

  return { nodes, edges };
}

export async function graphRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/graph/:agentId', { preHandler: requireApiKey }, async (req, reply) => {
    const { agentId } = req.params as { agentId: string };
    const { sessionId } = req.query as { sessionId?: string };

    const cacheKey = `graph:${agentId}${sessionId ? `:${sessionId}` : ''}`;
    const cached = await cache.get(cacheKey);
    if (cached) return reply.send(cached);

    const actions = sessionId
      ? await suiSql.querySessionActions(sessionId)
      : await suiSql.queryHistory(agentId, 200);

    const graph = buildGraph(actions);

    await cache.set(cacheKey, graph, 30);

    return reply.send({ agentId, sessionId, ...graph });
  });
}
