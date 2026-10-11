import crypto from "node:crypto";

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
export function logOperation(entry: LogEntry): void {
  // Hash session ID if present to prevent long-term tracking
  const safeEntry = {
    ...entry,
    sessionIdHash: entry.sessionIdHash
      ? crypto.createHash("sha256").update(entry.sessionIdHash).digest("hex").slice(0, 16)
      : undefined,
  };

  // Structured JSON log output suitable for CloudWatch Logs
  if (process.env.NODE_ENV !== "test") {
    console.log(JSON.stringify(safeEntry));
  }
}
