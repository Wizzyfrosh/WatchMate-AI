export interface QuotaCheckResult {
    allowed: boolean;
    reason?: "PER_MINUTE_LIMIT" | "DAILY_LIMIT" | "GLOBAL_KILL_SWITCH";
    retryAfterSeconds?: number;
}
export interface QuotaManager {
    checkAndConsumeQuota(sessionId: string): Promise<QuotaCheckResult>;
    isKillSwitchActive(): boolean;
    setKillSwitch(active: boolean): void;
}
/**
 * In-memory Quota Manager for local development and deterministic test execution.
 * Enforces:
 * - 6 requests per minute per session
 * - 30 requests per day per session
 * - Runtime global kill switch
 */
export declare class InMemoryQuotaManager implements QuotaManager {
    private minuteBuckets;
    private dailyCounts;
    private killSwitch;
    constructor(options?: {
        killSwitch?: boolean;
    });
    isKillSwitchActive(): boolean;
    setKillSwitch(active: boolean): void;
    checkAndConsumeQuota(sessionId: string): Promise<QuotaCheckResult>;
}
//# sourceMappingURL=quota.d.ts.map