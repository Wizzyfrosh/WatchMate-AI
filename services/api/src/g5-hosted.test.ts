import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "./app.js";
import type { LoadedContent } from "./content-loader.js";
import type { VideoRecord, Transcript } from "@watchmate/contracts";
import { MockAiProvider } from "./bedrock.js";
import { InMemorySessionStore } from "./auth.js";
import { InMemoryQuotaManager } from "./quota.js";
import { logOperation, type LogEntry } from "./logger.js";

// ── Test fixtures ───────────────────────────────────────────────────

const testVideo: VideoRecord = {
  id: "lesson-01",
  title: "Introduction to Solar System Astronomy",
  durationMs: 180000,
  description: "A foundational lesson exploring the sun and planets.",
  mediaKey: "media/lesson-01.mp4",
  captionsKey: "captions/lesson-01.vtt",
  transcriptVersion: "v1",
  rightsId: "rights-lesson-01",
};

const testTranscript: Transcript = {
  videoId: "lesson-01",
  transcriptVersion: "v1",
  durationMs: 180000,
  segments: [
    { id: "seg-001", startMs: 0, endMs: 10000, text: "Welcome to Solar System Astronomy." },
    { id: "seg-002", startMs: 10500, endMs: 22000, text: "At the center of our system is the Sun." },
    { id: "seg-003", startMs: 22500, endMs: 35000, text: "Closest to the Sun are terrestrial planets." },
    { id: "seg-004", startMs: 35500, endMs: 48000, text: "Mercury is heavily cratered with no atmosphere." },
  ],
};

const mockContent: LoadedContent = {
  catalog: [testVideo],
  videoMap: new Map([[testVideo.id, testVideo]]),
  transcriptMap: new Map([[testVideo.id, testTranscript]]),
};

function createTestApp(options?: {
  sessionStore?: InMemorySessionStore;
  quotaManager?: InMemoryQuotaManager;
}) {
  const sessionStore = options?.sessionStore ?? new InMemorySessionStore();
  const quotaManager = options?.quotaManager ?? new InMemoryQuotaManager();

  return {
    app: buildApp({
      content: mockContent,
      isDev: false,
      aiProvider: new MockAiProvider(),
      sessionStore,
      quotaManager,
    }),
    sessionStore,
    quotaManager,
  };
}

// ── Auth & Session Tests ────────────────────────────────────────────

describe("G5 — Session Authentication & Authorization", () => {
  it("POST /v1/auth/exchange returns 401 for invalid access code", async () => {
    const { app } = createTestApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/auth/exchange",
      payload: { accessCode: "wrong-code" },
    });
    assert.equal(res.statusCode, 401);
    const body = JSON.parse(res.payload);
    assert.equal(body.code, "INVALID_ACCESS_CODE");
    assert.equal(body.retryable, false);
  });

  it("POST /v1/auth/exchange returns 401 for missing access code", async () => {
    const { app } = createTestApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/auth/exchange",
      payload: {},
    });
    assert.equal(res.statusCode, 401);
  });

  it("POST /v1/auth/exchange returns session token for valid code", async () => {
    const { app } = createTestApp();

    // Use the default test access code (SHA-256 hash matches DEFAULT_ACCESS_CODE_HASH)
    const res = await app.inject({
      method: "POST",
      url: "/v1/auth/exchange",
      payload: { accessCode: "WATCHMATE-JUDGE-2026" },
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.status, "ok");
    assert.ok(body.token.startsWith("sess-"));
    assert.ok(typeof body.expiresAt === "number");
    assert.ok(body.expiresAt > Date.now());
  });

  it("AI endpoints reject requests without auth token", async () => {
    const { app } = createTestApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/assist",
      payload: {
        requestId: "req-1",
        videoId: "lesson-01",
        transcriptVersion: "v1",
        action: "explain",
        detail: "standard",
        playheadMs: 15000,
        watchedRanges: [[0, 15000]],
      },
    });
    assert.equal(res.statusCode, 401);
    const body = JSON.parse(res.payload);
    assert.equal(body.code, "UNAUTHORIZED");
  });

  it("AI endpoints reject requests with expired session", async () => {
    const sessionStore = new InMemorySessionStore();
    const { app } = createTestApp({ sessionStore });

    // Create a session and immediately expire it
    const session = await sessionStore.createSession();
    // Manually expire: override the session record
    (sessionStore as any).sessions.get(session.sessionId).expiresAt = Date.now() - 1000;

    const res = await app.inject({
      method: "POST",
      url: "/v1/assist",
      headers: { authorization: `Bearer ${session.sessionId}` },
      payload: {
        requestId: "req-1",
        videoId: "lesson-01",
        transcriptVersion: "v1",
        action: "explain",
        detail: "standard",
        playheadMs: 15000,
        watchedRanges: [[0, 15000]],
      },
    });
    assert.equal(res.statusCode, 401);
    const body = JSON.parse(res.payload);
    assert.equal(body.code, "SESSION_EXPIRED");
  });

  it("AI endpoints accept requests with valid session token", async () => {
    const sessionStore = new InMemorySessionStore();
    const { app } = createTestApp({ sessionStore });

    // Authenticate
    const authRes = await app.inject({
      method: "POST",
      url: "/v1/auth/exchange",
      payload: { accessCode: "WATCHMATE-JUDGE-2026" },
    });
    const { token } = JSON.parse(authRes.payload);

    // Use the token for an AI request
    const res = await app.inject({
      method: "POST",
      url: "/v1/assist",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        requestId: "req-1",
        videoId: "lesson-01",
        transcriptVersion: "v1",
        action: "explain",
        detail: "standard",
        playheadMs: 15000,
        watchedRanges: [[0, 15000]],
      },
    });
    assert.equal(res.statusCode, 200);
  });

  it("Public endpoints (health, catalog) do NOT require auth", async () => {
    const { app } = createTestApp();

    const healthRes = await app.inject({ method: "GET", url: "/health" });
    assert.equal(healthRes.statusCode, 200);

    const catalogRes = await app.inject({ method: "GET", url: "/v1/videos" });
    assert.equal(catalogRes.statusCode, 200);

    const videoRes = await app.inject({ method: "GET", url: "/v1/videos/lesson-01" });
    assert.equal(videoRes.statusCode, 200);
  });
});

// ── Quota Enforcement Tests ─────────────────────────────────────────

describe("G5 — Quota & Rate Limit Enforcement", () => {
  it("Enforces per-minute rate limit (max 6 req/min)", async () => {
    const sessionStore = new InMemorySessionStore();
    const quotaManager = new InMemoryQuotaManager();
    const { app } = createTestApp({ sessionStore, quotaManager });

    // Authenticate
    const authRes = await app.inject({
      method: "POST",
      url: "/v1/auth/exchange",
      payload: { accessCode: "WATCHMATE-JUDGE-2026" },
    });
    const { token } = JSON.parse(authRes.payload);

    const makeRequest = () =>
      app.inject({
        method: "POST",
        url: "/v1/assist",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          requestId: `req-${Date.now()}-${Math.random()}`,
          videoId: "lesson-01",
          transcriptVersion: "v1",
          action: "explain",
          detail: "standard",
          playheadMs: 15000,
          watchedRanges: [[0, 15000]],
        },
      });

    // Send 6 requests (all should succeed)
    for (let i = 0; i < 6; i++) {
      const res = await makeRequest();
      assert.equal(res.statusCode, 200, `Request ${i + 1} should succeed`);
    }

    // 7th request should be rate-limited
    const rateLimitedRes = await makeRequest();
    assert.equal(rateLimitedRes.statusCode, 429);
    const body = JSON.parse(rateLimitedRes.payload);
    assert.equal(body.code, "TOO_MANY_REQUESTS");
    assert.ok(body.message.includes("PER_MINUTE_LIMIT"));
    assert.ok(rateLimitedRes.headers["retry-after"]);
  });

  it("Enforces per-day rate limit (max 30 req/day)", async () => {
    const sessionStore = new InMemorySessionStore();
    const quotaManager = new InMemoryQuotaManager();
    const { app } = createTestApp({ sessionStore, quotaManager });

    const authRes = await app.inject({
      method: "POST",
      url: "/v1/auth/exchange",
      payload: { accessCode: "WATCHMATE-JUDGE-2026" },
    });
    const { token } = JSON.parse(authRes.payload);

    // Manually set daily count near the limit
    const today = new Date().toISOString().slice(0, 10);
    (quotaManager as any).dailyCounts.set(token, { count: 29, day: today });

    // This request should succeed (count goes from 29 to 30)
    const res1 = await app.inject({
      method: "POST",
      url: "/v1/assist",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        requestId: "req-day-last",
        videoId: "lesson-01",
        transcriptVersion: "v1",
        action: "explain",
        detail: "standard",
        playheadMs: 15000,
        watchedRanges: [[0, 15000]],
      },
    });
    assert.equal(res1.statusCode, 200);

    // This request should be daily-limited
    const res2 = await app.inject({
      method: "POST",
      url: "/v1/assist",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        requestId: "req-day-over",
        videoId: "lesson-01",
        transcriptVersion: "v1",
        action: "explain",
        detail: "standard",
        playheadMs: 15000,
        watchedRanges: [[0, 15000]],
      },
    });
    assert.equal(res2.statusCode, 429);
    const body = JSON.parse(res2.payload);
    assert.ok(body.message.includes("DAILY_LIMIT"));
  });
});

// ── Kill Switch Tests ───────────────────────────────────────────────

describe("G5 — AI Kill Switch", () => {
  it("Kill switch returns 503 for AI endpoints while preserving catalog", async () => {
    const sessionStore = new InMemorySessionStore();
    const quotaManager = new InMemoryQuotaManager({ killSwitch: true });
    const { app } = createTestApp({ sessionStore, quotaManager });

    // Auth exchange should still work
    const authRes = await app.inject({
      method: "POST",
      url: "/v1/auth/exchange",
      payload: { accessCode: "WATCHMATE-JUDGE-2026" },
    });
    assert.equal(authRes.statusCode, 200);
    const { token } = JSON.parse(authRes.payload);

    // AI endpoint should return 503 (kill switch)
    const res = await app.inject({
      method: "POST",
      url: "/v1/assist",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        requestId: "req-kill",
        videoId: "lesson-01",
        transcriptVersion: "v1",
        action: "explain",
        detail: "standard",
        playheadMs: 15000,
        watchedRanges: [[0, 15000]],
      },
    });
    assert.equal(res.statusCode, 503);
    const body = JSON.parse(res.payload);
    assert.equal(body.code, "AI_SERVICE_DISABLED");

    // Catalog browsing should still work
    const catalogRes = await app.inject({ method: "GET", url: "/v1/videos" });
    assert.equal(catalogRes.statusCode, 200);

    const healthRes = await app.inject({ method: "GET", url: "/health" });
    assert.equal(healthRes.statusCode, 200);
  });

  it("Kill switch can be toggled at runtime", async () => {
    const sessionStore = new InMemorySessionStore();
    const quotaManager = new InMemoryQuotaManager();
    const { app } = createTestApp({ sessionStore, quotaManager });

    const authRes = await app.inject({
      method: "POST",
      url: "/v1/auth/exchange",
      payload: { accessCode: "WATCHMATE-JUDGE-2026" },
    });
    const { token } = JSON.parse(authRes.payload);

    // Initially enabled — should succeed
    const res1 = await app.inject({
      method: "POST",
      url: "/v1/assist",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        requestId: "req-before-kill",
        videoId: "lesson-01",
        transcriptVersion: "v1",
        action: "explain",
        detail: "standard",
        playheadMs: 15000,
        watchedRanges: [[0, 15000]],
      },
    });
    assert.equal(res1.statusCode, 200);

    // Enable kill switch
    quotaManager.setKillSwitch(true);

    const res2 = await app.inject({
      method: "POST",
      url: "/v1/assist",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        requestId: "req-after-kill",
        videoId: "lesson-01",
        transcriptVersion: "v1",
        action: "explain",
        detail: "standard",
        playheadMs: 15000,
        watchedRanges: [[0, 15000]],
      },
    });
    assert.equal(res2.statusCode, 503);
    assert.equal(JSON.parse(res2.payload).code, "AI_SERVICE_DISABLED");
  });
});

// ── Security Guard Tests ────────────────────────────────────────────

describe("G5 — Security Guardrails", () => {
  it("Rejects DEV_AUTH_BYPASS in production mode", () => {
    const origEnv = process.env.DEV_AUTH_BYPASS;
    process.env.DEV_AUTH_BYPASS = "true";

    assert.throws(
      () =>
        buildApp({
          content: mockContent,
          isDev: false,
          aiProvider: new MockAiProvider(),
        }),
      /SECURITY_VIOLATION/
    );

    process.env.DEV_AUTH_BYPASS = origEnv;
  });

  it("Correlation ID is present on error responses", async () => {
    const { app } = createTestApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/assist",
      payload: {},
    });
    assert.equal(res.statusCode, 401);
    assert.ok(res.headers["x-correlation-id"]);
    const body = JSON.parse(res.payload);
    assert.ok(body.correlationId);
  });
});

// ── Safe Logging Tests ──────────────────────────────────────────────

describe("G5 — Safe Operational Logging", () => {
  it("Session IDs are hashed (not plaintext) in log entries", () => {
    const captured: string[] = [];
    const origLog = console.log;
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development"; // Enable console output for test

    console.log = (msg: string) => captured.push(msg);

    logOperation({
      timestamp: new Date().toISOString(),
      correlationId: "test-corr-id",
      sessionIdHash: "sess-abc-123-plaintext-id",
      action: "assist",
      status: "success",
      statusCode: 200,
      durationMs: 150,
    });

    console.log = origLog;
    process.env.NODE_ENV = origEnv;

    assert.equal(captured.length, 1);
    const logEntry = JSON.parse(captured[0]);

    // The sessionIdHash should be a 16-char hex hash, NOT the plaintext session ID
    assert.ok(logEntry.sessionIdHash.length <= 16, "Session ID should be truncated hash");
    assert.ok(
      !logEntry.sessionIdHash.includes("sess-abc"),
      "Plaintext session ID must NOT appear in logs"
    );

    // Request body / transcript text must NOT be in the log
    assert.equal(logEntry.action, "assist");
    assert.equal(logEntry.correlationId, "test-corr-id");
    assert.ok(!JSON.stringify(logEntry).includes("transcript"));
    assert.ok(!JSON.stringify(logEntry).includes("segment"));
  });

  it("Logs include required operational fields", () => {
    const captured: string[] = [];
    const origLog = console.log;
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    console.log = (msg: string) => captured.push(msg);

    logOperation({
      timestamp: "2026-10-11T12:00:00.000Z",
      correlationId: "corr-456",
      sessionIdHash: "sess-test",
      action: "quiz",
      status: "success",
      statusCode: 200,
      durationMs: 342,
      tokensUsed: 150,
    });

    console.log = origLog;
    process.env.NODE_ENV = origEnv;

    const logEntry = JSON.parse(captured[0]);
    assert.equal(logEntry.timestamp, "2026-10-11T12:00:00.000Z");
    assert.equal(logEntry.correlationId, "corr-456");
    assert.equal(logEntry.action, "quiz");
    assert.equal(logEntry.status, "success");
    assert.equal(logEntry.statusCode, 200);
    assert.equal(logEntry.durationMs, 342);
    assert.equal(logEntry.tokensUsed, 150);
  });
});

// ── InMemoryQuotaManager Unit Tests ─────────────────────────────────

describe("G5 — InMemoryQuotaManager Unit", () => {
  it("Allows requests within limits", async () => {
    const qm = new InMemoryQuotaManager();
    const result = await qm.checkAndConsumeQuota("sess-test");
    assert.equal(result.allowed, true);
  });

  it("Blocks after 6 per-minute requests", async () => {
    const qm = new InMemoryQuotaManager();
    for (let i = 0; i < 6; i++) {
      const r = await qm.checkAndConsumeQuota("sess-burst");
      assert.equal(r.allowed, true);
    }
    const blocked = await qm.checkAndConsumeQuota("sess-burst");
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.reason, "PER_MINUTE_LIMIT");
    assert.ok(typeof blocked.retryAfterSeconds === "number");
  });

  it("Blocks after 30 daily requests", async () => {
    const qm = new InMemoryQuotaManager();
    // Set daily count near limit
    const today = new Date().toISOString().slice(0, 10);
    (qm as any).dailyCounts.set("sess-daily", { count: 30, day: today });

    const blocked = await qm.checkAndConsumeQuota("sess-daily");
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.reason, "DAILY_LIMIT");
  });

  it("Kill switch blocks immediately", async () => {
    const qm = new InMemoryQuotaManager({ killSwitch: true });
    const result = await qm.checkAndConsumeQuota("any-session");
    assert.equal(result.allowed, false);
    assert.equal(result.reason, "GLOBAL_KILL_SWITCH");
  });

  it("Different sessions have independent quotas", async () => {
    const qm = new InMemoryQuotaManager();

    for (let i = 0; i < 6; i++) {
      await qm.checkAndConsumeQuota("sess-A");
    }

    // Session A should be blocked
    const blockedA = await qm.checkAndConsumeQuota("sess-A");
    assert.equal(blockedA.allowed, false);

    // Session B should still be allowed
    const allowedB = await qm.checkAndConsumeQuota("sess-B");
    assert.equal(allowedB.allowed, true);
  });
});

// ── InMemorySessionStore Unit Tests ──────────────────────────────────

describe("G5 — InMemorySessionStore Unit", () => {
  it("Creates valid session with future expiry", async () => {
    const store = new InMemorySessionStore();
    const session = await store.createSession();
    assert.ok(session.sessionId.startsWith("sess-"));
    assert.ok(session.expiresAt > Date.now());
    assert.ok(session.createdAt <= Date.now());
  });

  it("Validates active session", async () => {
    const store = new InMemorySessionStore();
    const session = await store.createSession();
    const valid = await store.validateSession(session.sessionId);
    assert.equal(valid, true);
  });

  it("Rejects unknown session ID", async () => {
    const store = new InMemorySessionStore();
    const valid = await store.validateSession("sess-nonexistent");
    assert.equal(valid, false);
  });

  it("Rejects expired session", async () => {
    const store = new InMemorySessionStore();
    const session = await store.createSession();
    // Manually expire
    (store as any).sessions.get(session.sessionId).expiresAt = Date.now() - 1;
    const valid = await store.validateSession(session.sessionId);
    assert.equal(valid, false);
  });
});
