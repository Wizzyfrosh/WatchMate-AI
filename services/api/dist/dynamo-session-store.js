import crypto from "node:crypto";
import { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand, } from "@aws-sdk/client-dynamodb";
/**
 * DynamoDB-backed session store for hosted deployment (PRD §12).
 *
 * Uses atomic PutItem with server-side TTL. Session IDs are UUIDs prefixed
 * with "sess-" for log grep-ability. DynamoDB TTL handles background cleanup
 * while authorization checks expiry at read time (PRD: "expiry is checked
 * in authorization; database TTL cleanup is not the access decision").
 */
export class DynamoSessionStore {
    client;
    tableName;
    sessionDurationMs;
    constructor(options = {}) {
        this.client = options.client ?? new DynamoDBClient({});
        this.tableName = options.tableName ?? process.env.DYNAMODB_SESSIONS_TABLE ?? "watchmate-sessions";
        this.sessionDurationMs = options.sessionDurationMs ?? 12 * 60 * 60 * 1000; // 12 hours
    }
    async createSession() {
        const sessionId = `sess-${crypto.randomUUID()}`;
        const now = Date.now();
        const expiresAt = now + this.sessionDurationMs;
        const expiresAtEpochSec = Math.floor(expiresAt / 1000);
        await this.client.send(new PutItemCommand({
            TableName: this.tableName,
            Item: {
                sessionId: { S: sessionId },
                createdAt: { N: String(now) },
                expiresAt: { N: String(expiresAtEpochSec) }, // TTL uses epoch seconds
                expiresAtMs: { N: String(expiresAt) }, // Precise ms for auth check
            },
        }));
        return { sessionId, createdAt: now, expiresAt };
    }
    async validateSession(sessionId) {
        const result = await this.client.send(new GetItemCommand({
            TableName: this.tableName,
            Key: { sessionId: { S: sessionId } },
            ProjectionExpression: "expiresAtMs",
        }));
        if (!result.Item)
            return false;
        const expiresAtMs = Number(result.Item.expiresAtMs?.N ?? "0");
        if (Date.now() > expiresAtMs) {
            // Expired — delete eagerly (TTL is background, not authorization)
            await this.client.send(new DeleteItemCommand({
                TableName: this.tableName,
                Key: { sessionId: { S: sessionId } },
            })).catch(() => { });
            return false;
        }
        return true;
    }
}
//# sourceMappingURL=dynamo-session-store.js.map