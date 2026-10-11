import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import type { QuotaCheckResult, QuotaManager } from "./quota.js";
/**
 * DynamoDB-backed atomic quota manager for hosted deployment (PRD §12/§13).
 *
 * Uses DynamoDB conditional updates (ADD + ConditionExpression) to enforce
 * per-minute and per-day rate limits atomically. This prevents concurrent
 * Lambda invocations from bypassing the quota — each increment is a single
 * atomic server-side operation.
 *
 * Limits:
 * - 6 requests per minute per session
 * - 30 requests per day per session
 * - Global AI kill switch (environment variable)
 */
export declare class DynamoQuotaManager implements QuotaManager {
    private client;
    private tableName;
    private killSwitch;
    constructor(options?: {
        client?: DynamoDBClient;
        tableName?: string;
        killSwitch?: boolean;
    });
    isKillSwitchActive(): boolean;
    setKillSwitch(active: boolean): void;
    checkAndConsumeQuota(sessionId: string): Promise<QuotaCheckResult>;
}
//# sourceMappingURL=dynamo-quota-manager.d.ts.map