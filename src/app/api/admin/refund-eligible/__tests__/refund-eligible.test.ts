import { describe, it, expect, vi, beforeEach } from "vitest";

// Imposta ADMIN_USER_IDS prima che il modulo venga caricato (è una const top-level nella route)
vi.hoisted(() => { process.env.ADMIN_USER_IDS = "admin-user-id"; });

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import sql from "@/lib/db";
import { GET } from "../route";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

function makeRequest(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return new Request(`http://localhost/api/admin/refund-eligible${qs ? "?" + qs : ""}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSql.mockReset();
});

// ─── Autenticazione ───────────────────────────────────────────────────────────

describe("autenticazione", () => {
  it("restituisce 401 se l'utente non è autenticato", async () => {
    mockAuth.mockResolvedValueOnce({ userId: null });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("restituisce 401 se l'utente non è admin", async () => {
    mockAuth.mockResolvedValueOnce({ userId: "regular-user" });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });
});

// ─── Validazione input ────────────────────────────────────────────────────────

describe("validazione input", () => {
  it("restituisce 400 se manca il parametro userId", async () => {
    mockAuth.mockResolvedValueOnce({ userId: "admin-user-id" });
    const res = await GET(makeRequest());
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing userId");
  });
});

// ─── Eleggibilità al rimborso ─────────────────────────────────────────────────

describe("eleggibilità al rimborso", () => {
  it("non eleggibile se non c'è subscription attiva", async () => {
    mockAuth.mockResolvedValueOnce({ userId: "admin-user-id" });
    mockSql.mockResolvedValueOnce([]); // query1: nessuna subscription active nel DB

    const res = await GET(makeRequest({ userId: "target-user" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.eligible).toBe(false);
  });

  it("non eleggibile se ha interviste dopo l'ultimo pagamento", async () => {
    mockAuth.mockResolvedValueOnce({ userId: "admin-user-id" });
    mockSql
      .mockResolvedValueOnce([{ paddle_subscription_id: "sub-1", plan: "pro", last_paid_at: "2024-01-01T00:00:00.000Z" }])
      .mockResolvedValueOnce([{ id: "session-1" }]); // ha fatto un'intervista → non eleggibile

    const res = await GET(makeRequest({ userId: "target-user" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.eligible).toBe(false);
  });

  it("eleggibile se non ha interviste dopo l'ultimo pagamento", async () => {
    mockAuth.mockResolvedValueOnce({ userId: "admin-user-id" });
    mockSql
      .mockResolvedValueOnce([{ paddle_subscription_id: "sub-1", plan: "pro", last_paid_at: "2024-01-01T00:00:00.000Z" }])
      .mockResolvedValueOnce([]); 

    const res = await GET(makeRequest({ userId: "target-user" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.eligible).toBe(true);
  });
});
