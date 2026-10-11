import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import crypto from "node:crypto";
import { healthRoutes } from "./routes/health.js";
import { videoRoutes } from "./routes/videos.js";
import { assistRoutes } from "./routes/assist.js";
import { quizRoutes } from "./routes/quizzes.js";
import type { LoadedContent } from "./content-loader.js";
import type { ErrorResponse } from "@watchmate/contracts";
import { type AiProvider, createAiProvider } from "./bedrock.js";
import { type SessionStore, InMemorySessionStore, authRoutes } from "./auth.js";
import { type QuotaManager, InMemoryQuotaManager } from "./quota.js";
import { logOperation, type LogEntry } from "./logger.js";

export interface AppOptions {
  content: LoadedContent;
  isDev?: boolean;
  aiProvider?: AiProvider;
  sessionStore?: SessionStore;
  quotaManager?: QuotaManager;
}

export function buildApp(options: AppOptions): FastifyInstance {
  const isDev = options.isDev ?? process.env.NODE_ENV !== "production";
  const aiProvider = options.aiProvider ?? createAiProvider();
  const sessionStore = options.sessionStore ?? new InMemorySessionStore();
  const quotaManager = options.quotaManager ?? new InMemoryQuotaManager();

  // Security guard (PRD Section 12): Prevent development authentication bypass in production
  if (!isDev && process.env.DEV_AUTH_BYPASS === "true") {
    throw new Error(
      "SECURITY_VIOLATION: DEV_AUTH_BYPASS cannot be enabled in non-development / hosted mode."
    );
  }

  const fastify = Fastify({
    logger: false,
    bodyLimit: 16384, // 16 KB body limit per PRD Section 10
  });

  fastify.register(cors, {
    origin: true,
  });

  // Correlation ID hook
  fastify.addHook("onRequest", async (request, reply) => {
    const headerCorrId = request.headers["x-correlation-id"];
    const correlationId =
      typeof headerCorrId === "string" && headerCorrId.length > 0
        ? headerCorrId
        : crypto.randomUUID();

    (request as any).correlationId = correlationId;
    (request as any).requestStartMs = Date.now();
    reply.header("x-correlation-id", correlationId);
  });

  // Session authentication + quota enforcement hook for AI endpoints (PRD §12)
  fastify.addHook("onRequest", async (request, reply) => {
    const url = request.url;

    // Public endpoints: health, catalog, auth exchange — no auth required
    if (
      url === "/health" ||
      url === "/v1/videos" ||
      url.startsWith("/v1/videos/") ||
      url === "/v1/auth/exchange"
    ) {
      return;
    }

    // AI endpoints require session auth (unless dev mode)
    if (isDev) {
      (request as any).sessionId = "dev-session";
      return;
    }

    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      const correlationId = (request as any).correlationId;
      const errorResponse: ErrorResponse = {
        code: "UNAUTHORIZED",
        message: "Missing or invalid session token. Exchange an access code first.",
        correlationId,
        retryable: false,
      };
      reply.status(401).send(errorResponse);
      return reply;
    }

    const isValid = await sessionStore.validateSession(token);
    if (!isValid) {
      const correlationId = (request as any).correlationId;
      const errorResponse: ErrorResponse = {
        code: "SESSION_EXPIRED",
        message: "Session has expired or was revoked. Please re-authenticate.",
        correlationId,
        retryable: false,
      };

      logOperation({
        timestamp: new Date().toISOString(),
        correlationId,
        sessionIdHash: token,
        action: "session_rejected",
        status: "error",
        statusCode: 401,
        durationMs: 0,
      });

      reply.status(401).send(errorResponse);
      return reply;
    }

    (request as any).sessionId = token;

    // Quota check (atomic per-request enforcement, PRD §13)
    const quotaResult = await quotaManager.checkAndConsumeQuota(token);
    if (!quotaResult.allowed) {
      const correlationId = (request as any).correlationId;

      if (quotaResult.reason === "GLOBAL_KILL_SWITCH") {
        const errorResponse: ErrorResponse = {
          code: "AI_SERVICE_DISABLED",
          message: "AI generation is temporarily disabled. Video playback remains available.",
          correlationId,
          retryable: false,
        };

        logOperation({
          timestamp: new Date().toISOString(),
          correlationId,
          sessionIdHash: token,
          action: "kill_switch_block",
          status: "disabled",
          statusCode: 503,
          durationMs: 0,
        });

        reply.status(503).send(errorResponse);
        return reply;
      }

      const errorResponse: ErrorResponse = {
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded (${quotaResult.reason}). Try again later.`,
        correlationId,
        retryable: true,
      };

      if (quotaResult.retryAfterSeconds) {
        reply.header("Retry-After", String(quotaResult.retryAfterSeconds));
      }

      logOperation({
        timestamp: new Date().toISOString(),
        correlationId,
        sessionIdHash: token,
        action: "quota_exceeded",
        status: "rate_limited",
        statusCode: 429,
        durationMs: 0,
      });

      reply.status(429).send(errorResponse);
      return reply;
    }
  });

  // Operational logging hook for AI responses (onResponse)
  fastify.addHook("onResponse", async (request, reply) => {
    const url = request.url;

    // Only log AI endpoint interactions
    if (url === "/v1/assist" || url === "/v1/quizzes") {
      const startMs = (request as any).requestStartMs ?? Date.now();
      const durationMs = Date.now() - startMs;
      const correlationId = (request as any).correlationId ?? "";
      const sessionId = (request as any).sessionId ?? "";

      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        correlationId,
        sessionIdHash: sessionId,
        action: url === "/v1/assist" ? "assist" : "quiz",
        status: reply.statusCode < 400 ? "success" : "error",
        statusCode: reply.statusCode,
        durationMs,
      };

      logOperation(entry);
    }
  });

  // Custom Error Handler matching PRD ErrorResponse contract
  fastify.setErrorHandler((error: any, request, reply) => {
    const correlationId = (request as any)?.correlationId || crypto.randomUUID();
    const statusCode = typeof error?.statusCode === "number" ? error.statusCode : 500;

    let code = "INTERNAL_SERVER_ERROR";
    if (statusCode === 400) code = "INVALID_REQUEST";
    else if (statusCode === 404) code = "NOT_FOUND";
    else if (statusCode === 409) code = "CONFLICT";
    else if (statusCode === 413) code = "PAYLOAD_TOO_LARGE";
    else if (statusCode === 429) code = "TOO_MANY_REQUESTS";

    const errorResponse: ErrorResponse = {
      code,
      message: error?.message || "An unexpected error occurred",
      correlationId,
      retryable: statusCode >= 500,
    };

    reply.status(statusCode).send(errorResponse);
  });

  // Register routes
  fastify.register(healthRoutes);
  fastify.register(videoRoutes(options.content));
  fastify.register(authRoutes(sessionStore));
  fastify.register(assistRoutes(options.content, aiProvider));
  fastify.register(quizRoutes(options.content, aiProvider));

  return fastify;
}
