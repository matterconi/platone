import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../call-end/route";

vi.mock("@/lib/db", () => ({ default: vi.fn() }));

import sql from "@/lib/db";
import { NextRequest } from "next/server";
const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

// Imposta il secret VAPI come variabile d'ambiente per tutti i test
beforeEach(() => {
  mockSql.mockReset();
  process.env.VAPI_WEBHOOK_SECRET = "test-secret";
});

// Helper: costruisce una Request con header e body pronti
function makeRequest(body: unknown, secret = "test-secret") {
  return new Request("http://localhost/api/interview/call-end", {
    method: "POST",
    headers: { "x-vapi-secret": secret },
    body: JSON.stringify(body),
  });
}

// ─── Autenticazione ───────────────────────────────────────────────────────────

describe("autenticazione", () => {
  it("restituisce 401 se il secret è assente", async () => {
    const req = makeRequest({}, "");           // secret sbagliato
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("restituisce 401 se il secret è errato", async () => {
    const req = makeRequest({}, "secret-sbagliato");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });
});

// ─── Filtro eventi ────────────────────────────────────────────────────────────

describe("filtro eventi", () => {
  it("ignora eventi che non sono end-of-call-report", async () => {
    const req = makeRequest({ message: { type: "call-started" } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ received: true });
    // Il DB non deve essere toccato
    expect(mockSql).not.toHaveBeenCalled();
  });
});

// ─── Deduzione crediti ────────────────────────────────────────────────────────

describe("deduzione crediti", () => {
  it("90 secondi di chiamata → scala 4 crediti (Math.ceil(90/60)*2)", async () => {
    mockSql
    .mockResolvedValueOnce([{ user_id: "user-123" }])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ id: 1 }])
    .mockResolvedValueOnce([]);

    const req = makeRequest({
      message: {
        type: "end-of-call-report",
        call: { id: "call-abc", assistantId: undefined },
        durationSeconds: 90,
      },
    });

    const res = await POST(req as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual( {received: true} );

    expect(mockSql).toHaveBeenCalledTimes(4);
    expect(mockSql.mock.calls[3].slice(1)).toEqual([4, "user-123"]);
  });
  it("call_id non trovato in sessions → 200, nessuna deduzione", async () => {
    mockSql.mockResolvedValueOnce([]); // SELECT → sessione non trovata

    const req = makeRequest({
      message: {
        type: "end-of-call-report",
        call: { id: "call-sconosciuto" },
        durationSeconds: 90,
      },
    });

    const res = await POST(req as NextRequest);
    expect(res.status).toBe(200);
    expect(mockSql).toHaveBeenCalledTimes(1); // solo il SELECT, nessuna deduzione
  });

  it("VAPI retry (stesso call_id) → ON CONFLICT → nessuna deduzione", async () => {
    mockSql
    .mockResolvedValueOnce([{ user_id: "user-123" }])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([]);

    const req = makeRequest({
      message: {
        type: "end-of-call-report",
        call: { id: "call-abc", assistantId: undefined },
        durationSeconds: 90,
      },
    });

    const res = await POST(req as NextRequest);
    expect(res.status).toBe(200);
    expect(mockSql).toHaveBeenCalledTimes(3); // SELECT + UPDATE sessions + INSERT conflitto
  });
});
