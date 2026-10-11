import crypto from "node:crypto";
export class InMemorySessionStore {
    sessions = new Map();
    async createSession() {
        const sessionId = `sess-${crypto.randomUUID()}`;
        const now = Date.now();
        const record = {
            sessionId,
            createdAt: now,
            expiresAt: now + 12 * 60 * 60 * 1000, // 12-hour evaluation window
        };
        this.sessions.set(sessionId, record);
        return record;
    }
    async validateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
        if (Date.now() > session.expiresAt) {
            this.sessions.delete(sessionId);
            return false;
        }
        return true;
    }
}
// Default judge evaluation code hash (SHA-256 for "WATCHMATE-JUDGE-2026")
const DEFAULT_ACCESS_CODE_HASH = "89fe36c867b39031abe3027fdc2129be472d442d184eb6383516605523e7271f";
export function verifyAccessCode(code) {
    if (!code || typeof code !== "string")
        return false;
    const hash = crypto.createHash("sha256").update(code.trim()).digest("hex");
    const expectedHash = process.env.EVAL_CODE_HASH || DEFAULT_ACCESS_CODE_HASH;
    return hash === expectedHash;
}
export const authRoutes = (sessionStore) => {
    return async (fastify) => {
        fastify.post("/v1/auth/exchange", async (request, reply) => {
            const body = request.body;
            const code = body?.accessCode;
            if (!code || !verifyAccessCode(code)) {
                const errorResponse = {
                    code: "INVALID_ACCESS_CODE",
                    message: "Invalid or revoked evaluation access code.",
                    correlationId: request.correlationId,
                    retryable: false,
                };
                return reply.status(401).send(errorResponse);
            }
            const session = await sessionStore.createSession();
            return reply.status(200).send({
                status: "ok",
                token: session.sessionId,
                expiresAt: session.expiresAt,
            });
        });
    };
};
//# sourceMappingURL=auth.js.map