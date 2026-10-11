import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import type { SessionRecord, SessionStore } from "./auth.js";
/**
 * DynamoDB-backed session store for hosted deployment (PRD §12).
 *
 * Uses atomic PutItem with server-side TTL. Session IDs are UUIDs prefixed
 * with "sess-" for log grep-ability. DynamoDB TTL handles background cleanup
 * while authorization checks expiry at read time (PRD: "expiry is checked
 * in authorization; database TTL cleanup is not the access decision").
 */
export declare class DynamoSessionStore implements SessionStore {
    private client;
    private tableName;
    private sessionDurationMs;
    constructor(options?: {
        client?: DynamoDBClient;
        tableName?: string;
        sessionDurationMs?: number;
    });
    createSession(): Promise<SessionRecord>;
    validateSession(sessionId: string): Promise<boolean>;
}
//# sourceMappingURL=dynamo-session-store.d.ts.map