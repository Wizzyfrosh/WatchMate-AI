export interface LogEntry {
    timestamp: string;
    correlationId: string;
    sessionIdHash?: string;
    action: string;
    status: "success" | "error" | "rate_limited" | "disabled";
    statusCode: number;
    durationMs: number;
    tokensUsed?: number;
    errorMessage?: string;
}
/**
 * Safe operational logger (PRD §12).
 * Hashes session IDs and strictly avoids printing request bodies or transcript text.
 */
export declare function logOperation(entry: LogEntry): void;
//# sourceMappingURL=logger.d.ts.map