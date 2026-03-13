import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import sql from "@/lib/db";
import { GET, POST } from "../route";
import { NextRequest } from "next/server";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

function makeGetRequest(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return new NextRequest(`http://localhost/api/interviews${qs ? "?" + qs : ""}`);
}

function makePostRequest(body: unknown, secret = "test-secret") {
  return new NextRequest("http://localhost/api/interviews", {
    method: "POST",
    headers: { "x-vapi-secret": secret },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSql.mockReset();
  process.env.VAPI_WEBHOOK_SECRET = "test-secret";
});

// ─── GET ──────────────────────────────────────────────────────────────────────

describe("GET interviews", () => {
  it("restituisce 401 se l'utente non è autenticato", async () => {});

  it("restituisce 200 con lista vuota", async () => {});

  it("restituisce total_count dalla prima riga", async () => {});
});

// ─── POST (VAPI webhook) ──────────────────────────────────────────────────────

describe("POST interviews (VAPI webhook)", () => {
  it("restituisce 401 se il secret è errato", async () => {});

  it("restituisce 500 se manca call.id", async () => {});

  it("restituisce 500 se nessuna sessione trovata per il call_id", async () => {});

  it("restituisce 200 e salva l'intervista", async () => {});
});
