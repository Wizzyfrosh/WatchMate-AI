import {
  DynamoDBClient,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
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
export class DynamoQuotaManager implements QuotaManager {
  private client: DynamoDBClient;
  private tableName: string;
  private killSwitch: boolean;

  constructor(options: {
    client?: DynamoDBClient;
    tableName?: string;
    killSwitch?: boolean;
  } = {}) {
    this.client = options.client ?? new DynamoDBClient({});
    this.tableName = options.tableName ?? process.env.DYNAMODB_QUOTAS_TABLE ?? "watchmate-quotas";
    this.killSwitch = options.killSwitch ?? (process.env.AI_KILL_SWITCH === "true");
  }

  isKillSwitchActive(): boolean {
    return this.killSwitch;
  }

  setKillSwitch(active: boolean): void {
    this.killSwitch = active;
  }

  async checkAndConsumeQuota(sessionId: string): Promise<QuotaCheckResult> {
    if (this.killSwitch) {
      return { allowed: false, reason: "GLOBAL_KILL_SWITCH" };
    }

    const now = Date.now();
    const currentMinute = Math.floor(now / 60000); // epoch-minute
    const today = new Date().toISOString().slice(0, 10);

    // 1. Atomic per-minute rate check
    const minuteKey = `rpm:${sessionId}:${currentMinute}`;
    const minuteTtl = Math.floor(now / 1000) + 120; // expire 2 minutes after window

    try {
      await this.client.send(
        new UpdateItemCommand({
          TableName: this.tableName,
          Key: { quotaKey: { S: minuteKey } },
          UpdateExpression: "ADD #count :one SET #ttl = if_not_exists(#ttl, :ttl)",
          ConditionExpression: "attribute_not_exists(#count) OR #count < :maxMinute",
          ExpressionAttributeNames: {
            "#count": "requestCount",
            "#ttl": "expiresAt",
          },
          ExpressionAttributeValues: {
            ":one": { N: "1" },
            ":maxMinute": { N: "6" },
            ":ttl": { N: String(minuteTtl) },
          },
        })
      );
    } catch (err: any) {
      if (err.name === "ConditionalCheckFailedException") {
        return {
          allowed: false,
          reason: "PER_MINUTE_LIMIT",
          retryAfterSeconds: Math.max(1, 60 - (now % 60000) / 1000),
        };
      }
      throw err; // unexpected DynamoDB error
    }

    // 2. Atomic per-day rate check
    const dailyKey = `daily:${sessionId}:${today}`;
    const dayEndTtl = Math.floor(
      new Date(`${today}T23:59:59.999Z`).getTime() / 1000
    ) + 3600; // expire 1h after midnight

    try {
      await this.client.send(
        new UpdateItemCommand({
          TableName: this.tableName,
          Key: { quotaKey: { S: dailyKey } },
          UpdateExpression: "ADD #count :one SET #ttl = if_not_exists(#ttl, :ttl)",
          ConditionExpression: "attribute_not_exists(#count) OR #count < :maxDaily",
          ExpressionAttributeNames: {
            "#count": "requestCount",
            "#ttl": "expiresAt",
          },
          ExpressionAttributeValues: {
            ":one": { N: "1" },
            ":maxDaily": { N: "30" },
            ":ttl": { N: String(dayEndTtl) },
          },
        })
      );
    } catch (err: any) {
      if (err.name === "ConditionalCheckFailedException") {
        return {
          allowed: false,
          reason: "DAILY_LIMIT",
          retryAfterSeconds: 3600,
        };
      }
      throw err;
    }

    return { allowed: true };
  }
}
