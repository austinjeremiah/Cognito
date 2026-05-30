import { ActionLog, Session, AgentRecord } from '../types/ActionLog';
import { SuiSQLError } from '../types/errors';
import { config } from '../config';
import logger from '../utils/logger';

export class SuiSQLService {
  private db: any;
  private initialized = false;

  async init(): Promise<void> {
    try {
      const { default: SuiSql } = await import('@fizzyflow/suisql');
      // Tap all console output during init to surface SuiSQL internal logs
      const origLog = console.log;
      const origInfo = console.info;
      const origError = console.error;
      const origWarn = console.warn;
      const safeStr = (a: any): string => {
        if (a === null || a === undefined) return String(a);
        if (typeof a !== 'object') return String(a);
        try { return JSON.stringify(a); } catch { return `[${a?.constructor?.name ?? 'object'}]`; }
      };
      const tap = (level: string) => (...args: any[]) => {
        logger.info(`[SuiSQL:${level}] ${args.map(safeStr).join(' ')}`);
      };
      console.log = tap('log');
      console.info = tap('info');
      console.error = tap('error');
      console.warn = tap('warn');
      // Use SuiMaster from suidouble — the pattern SuiSQL examples use
      const { SuiMaster } = await import('suidouble');

      const suiMaster = new SuiMaster({
        client: config.SUISQL_NETWORK,
        privateKey: config.SUI_PRIVATE_KEY,
        debug: false,
      });
      await suiMaster.initialize();
      logger.info('SuiMaster address', { address: suiMaster.address });

      this.db = new SuiSql({
        name: 'cognito-audit-db',
        network: config.SUISQL_NETWORK,
        debug: true,
        suiClient: suiMaster.client,
        signer: suiMaster.signer as any,
        id: config.SUISQL_DB_OBJECT_ID || undefined,
        publisherUrl: config.WALRUS_PUBLISHER_URL,
        aggregatorUrl: config.WALRUS_AGGREGATOR_URL,
      });

      const state = await this.db.initialize();

      // Restore console
      console.log = origLog;
      console.info = origInfo;
      console.error = origError;
      console.warn = origWarn;

      logger.info('SuiSQL state', { state });

      if (state === 'EMPTY') {
        await this.createTables();
      } else if (state === 'OK') {
        logger.info('SuiSQL loaded existing DB');
      } else {
        throw new SuiSQLError(`SuiSQL init returned state: ${state}`);
      }

      this.initialized = true;

      if (!config.SUISQL_DB_OBJECT_ID && this.db.id) {
        logger.info(`Add to .env → SUISQL_DB_OBJECT_ID=${this.db.id}`);
      }
    } catch (err) {
      throw new SuiSQLError(`SuiSQL init failed: ${(err as Error).message}`);
    }
  }

  private async createTables(): Promise<void> {
    await this.db.iterateStatements(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        total_sessions INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        action_count INTEGER DEFAULT 0,
        blob_id TEXT,
        mainnet_tx_digest TEXT
      );

      CREATE TABLE IF NOT EXISTS actions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        ts INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        description TEXT,
        blob_id TEXT,
        parent_action_id TEXT,
        metadata TEXT
      );
    `);
    logger.info('SuiSQL tables created');
  }

  private ensureInit(): void {
    if (!this.initialized) throw new SuiSQLError('SuiSQLService not initialized');
  }

  async upsertAgent(agent: AgentRecord): Promise<void> {
    this.ensureInit();
    await this.db.query(
      `INSERT OR REPLACE INTO agents VALUES (?, ?, ?, ?)`,
      [agent.id, agent.name, agent.createdAt, agent.totalSessions]
    );
  }

  async insertSession(session: Session): Promise<void> {
    this.ensureInit();
    await this.db.query(
      `INSERT INTO sessions VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id, session.agentId, session.startedAt,
        session.endedAt ?? null, session.actionCount,
        session.blobId ?? null, session.mainnetTxDigest ?? null,
      ]
    );
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<void> {
    this.ensureInit();
    if (updates.endedAt !== undefined) {
      await this.db.query(`UPDATE sessions SET ended_at = ? WHERE id = ?`, [updates.endedAt, sessionId]);
    }
    if (updates.blobId !== undefined) {
      await this.db.query(`UPDATE sessions SET blob_id = ? WHERE id = ?`, [updates.blobId, sessionId]);
    }
    if (updates.mainnetTxDigest !== undefined) {
      await this.db.query(`UPDATE sessions SET mainnet_tx_digest = ? WHERE id = ?`, [updates.mainnetTxDigest, sessionId]);
    }
    if (updates.actionCount !== undefined) {
      await this.db.query(`UPDATE sessions SET action_count = ? WHERE id = ?`, [updates.actionCount, sessionId]);
    }
  }

  async insertAction(action: ActionLog): Promise<void> {
    this.ensureInit();
    await this.db.query(
      `INSERT INTO actions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        action.id, action.sessionId, action.agentId, action.ts,
        action.actionType, action.description,
        action.blobId ?? null, action.parentActionId ?? null,
        JSON.stringify(action.metadata ?? {}),
      ]
    );
  }

  async updateActionBlobId(actionId: string, blobId: string): Promise<void> {
    this.ensureInit();
    await this.db.query(`UPDATE actions SET blob_id = ? WHERE id = ?`, [blobId, actionId]);
  }

  async getAction(actionId: string): Promise<ActionLog | null> {
    this.ensureInit();
    const rows = await this.db.query(`SELECT * FROM actions WHERE id = ? LIMIT 1`, [actionId]);
    if (!rows?.length) return null;
    return this.rowToAction(rows[0]);
  }

  async getSession(sessionId: string): Promise<Session | null> {
    this.ensureInit();
    const rows = await this.db.query(`SELECT * FROM sessions WHERE id = ? LIMIT 1`, [sessionId]);
    if (!rows?.length) return null;
    return rows[0] as Session;
  }

  async queryHistory(agentId: string, limit = 50): Promise<ActionLog[]> {
    this.ensureInit();
    const rows = await this.db.query(
      `SELECT * FROM actions WHERE agent_id = ? ORDER BY ts DESC LIMIT ?`,
      [agentId, limit]
    );
    return (rows ?? []).map((r: any) => this.rowToAction(r));
  }

  async querySessionActions(sessionId: string): Promise<ActionLog[]> {
    this.ensureInit();
    const rows = await this.db.query(
      `SELECT * FROM actions WHERE session_id = ? ORDER BY ts ASC`,
      [sessionId]
    );
    return (rows ?? []).map((r: any) => this.rowToAction(r));
  }

  async getAgentSessions(agentId: string): Promise<Session[]> {
    this.ensureInit();
    const rows = await this.db.query(
      `SELECT * FROM sessions WHERE agent_id = ? ORDER BY started_at DESC`,
      [agentId]
    );
    return rows ?? [];
  }

  async getAllAgents(): Promise<AgentRecord[]> {
    this.ensureInit();
    const rows = await this.db.query(`SELECT * FROM agents ORDER BY created_at DESC`);
    return rows ?? [];
  }

  async getStats(): Promise<{ agents: number; sessions: number; actions: number; anchors: number }> {
    this.ensureInit();
    const [agents, sessions, actions, anchors] = await Promise.all([
      this.db.query(`SELECT COUNT(*) as count FROM agents`),
      this.db.query(`SELECT COUNT(*) as count FROM sessions`),
      this.db.query(`SELECT COUNT(*) as count FROM actions`),
      this.db.query(`SELECT COUNT(*) as count FROM sessions WHERE mainnet_tx_digest IS NOT NULL`),
    ]);
    return {
      agents: agents?.[0]?.count ?? 0,
      sessions: sessions?.[0]?.count ?? 0,
      actions: actions?.[0]?.count ?? 0,
      anchors: anchors?.[0]?.count ?? 0,
    };
  }

  async persist(): Promise<void> {
    this.ensureInit();
    await this.db.sync();
    logger.info('SuiSQL synced to blockchain');
  }

  private rowToAction(row: any): ActionLog {
    return {
      id: row.id,
      sessionId: row.session_id,
      agentId: row.agent_id,
      ts: row.ts,
      actionType: row.action_type,
      description: row.description,
      blobId: row.blob_id ?? undefined,
      parentActionId: row.parent_action_id ?? undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }
}
