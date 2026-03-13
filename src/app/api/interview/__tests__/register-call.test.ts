import { describe, it, expect, vi, beforeEach } from "vitest";

// — Mock delle dipendenze —
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: vi.fn() }));

// — Import dei moduli mockati —
import { auth } from "@clerk/nextjs/server";
import sql from "@/lib/db";
import { POST } from "../register-call/route";

// — Cast a mock tipizzati —
const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

// — Helper: costruisce una Request POST con body JSON —
function makeRequest(body: unknown = {}) {
  return new Request("http://localhost/api/interview/register-call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Autenticazione ───────────────────────────────────────────────────────────

describe("autenticazione", () => {
  it("restituisce 401 se l'utente non è loggato", async () => {
    mockAuth.mockResolvedValueOnce({userId: null});

    const req = makeRequest();
    const res = await POST(req);

    expect(res.status).toBe(401);
  });
});

// ─── Validazione input ────────────────────────────────────────────────────────

describe("validazione input", () => {
  it("restituisce 400 se callId è assente", async () => {
    mockAuth.mockResolvedValueOnce({userId: "user_123"});

    const req = makeRequest({});
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ─── Registrazione sessione ───────────────────────────────────────────────────

describe("registrazione sessione", () => {
  it("restituisce 200 e inserisce la sessione", async () => {
    mockAuth.mockResolvedValueOnce({userId: "user_123"});

    const req = makeRequest({
      callId: "call_start"
    });
    mockSql.mockResolvedValueOnce([]);
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockSql.mock.calls[0].slice(1)).toEqual(["call_start", "user_123", null]);
  });
});
