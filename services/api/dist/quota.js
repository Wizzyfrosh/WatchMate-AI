/**
 * In-memory Quota Manager for local development and deterministic test execution.
 * Enforces:
 * - 6 requests per minute per session
 * - 30 requests per day per session
 * - Runtime global kill switch
 */
export class InMemoryQuotaManager {
    minuteBuckets = new Map();
    dailyCounts = new Map();
    killSwitch = false;
    constructor(options) {
        this.killSwitch =
            options?.killSwitch ?? (process.env.AI_KILL_SWITCH === "true");
    }
    isKillSwitchActive() {
        return this.killSwitch;
    }
    setKillSwitch(active) {
        this.killSwitch = active;
    }
    async checkAndConsumeQuota(sessionId) {
        if (this.killSwitch) {
            return {
                allowed: false,
                reason: "GLOBAL_KILL_SWITCH",
            };
        }
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const today = new Date().toISOString().slice(0, 10);
        // 1. Check per-minute rate limit (max 6 req/min)
        const timestamps = (this.minuteBuckets.get(sessionId) || []).filter((ts) => ts > oneMinuteAgo);
        if (timestamps.length >= 6) {
            const oldestInWindow = timestamps[0];
            const waitSec = Math.ceil((oldestInWindow + 60000 - now) / 1000);
            return {
                allowed: false,
                reason: "PER_MINUTE_LIMIT",
                retryAfterSeconds: Math.max(1, waitSec),
            };
        }
        // 2. Check daily allowance (max 30 req/day)
        const daily = this.dailyCounts.get(sessionId);
        let currentDailyCount = 0;
        if (daily && daily.day === today) {
            currentDailyCount = daily.count;
        }
        if (currentDailyCount >= 30) {
            return {
                allowed: false,
                reason: "DAILY_LIMIT",
                retryAfterSeconds: 3600,
            };
        }
        // Consume quota
        timestamps.push(now);
        this.minuteBuckets.set(sessionId, timestamps);
        this.dailyCounts.set(sessionId, {
            count: currentDailyCount + 1,
            day: today,
        });
        return { allowed: true };
    }
}
//# sourceMappingURL=quota.js.map