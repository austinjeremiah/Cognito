import { SuiSQLService } from './SuiSQLService';
import { WalrusService } from './WalrusService';
import { CacheService } from './CacheService';
import { ActionQueueService } from './ActionQueueService';

export const suiSql = new SuiSQLService();
export const walrus = new WalrusService();
export const cache = new CacheService();
export const queue = new ActionQueueService();
