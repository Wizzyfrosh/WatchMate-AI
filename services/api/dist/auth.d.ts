import type { FastifyPluginAsync } from "fastify";
import type { QuotaManager } from "./quota.js";
export interface SessionRecord {
    sessionId: string;
    createdAt: number;
    expiresAt: number;
}
export interface SessionStore {
    createSession(): Promise<SessionRecord>;
    validateSession(sessionId: string): Promise<boolean>;
}
export declare class InMemorySessionStore implements SessionStore {
    private sessions;
    createSession(): Promise<SessionRecord>;
    validateSession(sessionId: string): Promise<boolean>;
}
export declare function verifyAccessCode(code: string): boolean;
export interface AuthPluginOptions {
    sessionStore: SessionStore;
    quotaManager: QuotaManager;
    isDev?: boolean;
}
export declare const authRoutes: (sessionStore: SessionStore) => FastifyPluginAsync;
//# sourceMappingURL=auth.d.ts.map