import { describe, it, expect, vi, beforeEach } from "vitest";

// — Mock delle dipendenze —
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: vi.fn() }));
vi.mock("@/lib/subscription", () => ({ getUserAccess: vi.fn() }));
vi.mock("@ai-sdk/deepseek", () => ({ createDeepSeek: vi.fn(() => vi.fn()) }));
vi.mock("ai", () => ({ generateObject: vi.fn() }));

// — Import dei moduli mockati —
import { auth } from "@clerk/nextjs/server";
import sql from "@/lib/db";
import { getUserAccess } from "@/lib/subscription";
import { generateObject } from "ai";
import { POST } from "../start/route";

// — Cast a mock tipizzati —
const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockSql = sql as unknown as ReturnType<typeof vi.fn>;
const mockGetUserAccess = getUserAccess as ReturnType<typeof vi.fn>;
const mockGenerateObject = generateObject as ReturnType<typeof vi.fn>;

// — Helper: costruisce una Request POST con body JSON —
function makeRequest(body: unknown = {}) {
  return new Request("http://localhost/api/interview/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// — Helper: mock fetch per VAPI call creation —
function mockVapiSuccess() {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => ({ id: "call_123", webCallUrl: "wss://example.vapi.ai/call_123" }),
    text: async () => "",
  } as Response);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Autenticazione ───────────────────────────────────────────────────────────

describe("autenticazione", () => {
  it("restituisce 401 se l'utente non è loggato", async () => {
    mockAuth.mockResolvedValueOnce({ userId: null });
    const req = makeRequest();
    const res = await POST(req);

    expect(res.status).toBe(401);
  });
});

// ─── Utente con subscription ──────────────────────────────────────────────────

describe("subscription attiva", () => {
  it("restituisce 200 se ha crediti sufficienti", async () => {
    mockAuth.mockResolvedValueOnce({ userId: "user_123" });
    mockGetUserAccess.mockResolvedValueOnce({ hasActiveSubscription: true, plan: "pro", credits: 100 });
    mockSql.mockResolvedValueOnce([]); // extras query
    mockSql.mockResolvedValueOnce([]); // interview_sessions insert
    mockGenerateObject.mockResolvedValueOnce({ object: { valid: true } });
    mockVapiSuccess();

    const req = makeRequest();
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.webCall).toBeDefined();
    expect(body.webCall.id).toBe("call_123");
  });

  it("restituisce 403 se ha crediti esauriti", async () => {
    mockAuth.mockResolvedValueOnce({ userId: "user_123" });
    mockGetUserAccess.mockResolvedValueOnce({ hasActiveSubscription: true, plan: "pro", credits: 0 });

    const req = makeRequest();
    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it("restituisce 403 se ha meno di 1 minuto di crediti", async () => {
    mockAuth.mockResolvedValueOnce({ userId: "user_123" });
    // 1 credit = 30 secondi a 2 credits/min → remainingSeconds = 0 (floor(1/2)*60 = 0)
    mockGetUserAccess.mockResolvedValueOnce({ hasActiveSubscription: true, plan: "pro", credits: 1 });

    const req = makeRequest();
    const res = await POST(req);

    expect(res.status).toBe(403);
  });
});

// ─── Utente in trial ──────────────────────────────────────────────────────────

describe("trial", () => {
  it("restituisce 200 se il trial non è stato usato", async () => {
    mockAuth.mockResolvedValueOnce({ userId: "user_123" });
    mockGetUserAccess.mockResolvedValueOnce({ hasActiveSubscription: false, trialUsed: false });
    mockSql.mockResolvedValueOnce([]); // UPDATE trial_used
    mockSql.mockResolvedValueOnce([]); // interview_sessions insert
    mockGenerateObject.mockResolvedValueOnce({ object: { valid: true } });
    mockVapiSuccess();

    const req = makeRequest();
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.webCall).toBeDefined();
  });

  it("restituisce 403 se il trial è già stato usato", async () => {
    mockAuth.mockResolvedValueOnce({ userId: "user_123" });
    mockGetUserAccess.mockResolvedValueOnce({ hasActiveSubscription: false, trialUsed: true });

    const req = makeRequest();
    const res = await POST(req);

    expect(res.status).toBe(403);
  });
});

// ─── Validazione AI ───────────────────────────────────────────────────────────

describe("validazione AI", () => {
  it("restituisce 422 se il messaggio è off-topic", async () => {
    mockAuth.mockResolvedValueOnce({ userId: "user_123" });
    mockGetUserAccess.mockResolvedValueOnce({ hasActiveSubscription: true, plan: "pro", credits: 100 });
    mockSql.mockResolvedValueOnce([]); // extras query
    mockGenerateObject.mockResolvedValueOnce({ object: { valid: false } });

    const req = makeRequest();
    const res = await POST(req);

    expect(res.status).toBe(422);
  });
});

// ─── VAPI failure ─────────────────────────────────────────────────────────────

describe("VAPI error", () => {
  it("restituisce 502 se VAPI non riesce a creare la call", async () => {
    mockAuth.mockResolvedValueOnce({ userId: "user_123" });
    mockGetUserAccess.mockResolvedValueOnce({ hasActiveSubscription: true, plan: "pro", credits: 100 });
    mockSql.mockResolvedValueOnce([]); // extras query
    mockGenerateObject.mockResolvedValueOnce({ object: { valid: true } });
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      text: async () => "VAPI error",
    } as Response);

    const req = makeRequest();
    const res = await POST(req);

    expect(res.status).toBe(502);
  });
});
