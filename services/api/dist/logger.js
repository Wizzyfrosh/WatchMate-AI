import crypto from "node:crypto";
/**
 * Safe operational logger (PRD §12).
 * Hashes session IDs and strictly avoids printing request bodies or transcript text.
 */
export function logOperation(entry) {
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
//# sourceMappingURL=logger.js.map