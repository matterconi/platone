import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ default: vi.fn() }));

import sql from "@/lib/db";
import { GET, POST } from "../route";
import { NextRequest } from "next/server";

const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

function makeGetRequest(interviewId?: string) {
  const url = interviewId
    ? `http://localhost/api/attempts?interviewId=${interviewId}`
    : "http://localhost/api/attempts";
  return new NextRequest(url);
}

function makePostRequest(body: unknown, secret = "test-secret") {
  return new NextRequest("http://localhost/api/attempts", {
    method: "POST",
    headers: { "x-vapi-secret": secret },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockSql.mockReset();
  process.env.VAPI_WEBHOOK_SECRET = "test-secret";
});

// ─── GET ──────────────────────────────────────────────────────────────────────

describe("GET attempts", () => {
  it("restituisce 400 se manca interviewId", async () => {});

  it("restituisce 200 con la lista degli attempt", async () => {});

  it("restituisce 500 in caso di errore DB", async () => {});
});

// ─── POST (VAPI webhook) ──────────────────────────────────────────────────────

describe("POST attempts (VAPI webhook)", () => {
  it("restituisce 401 se il secret è errato", async () => {});

  it("restituisce 500 se mancano userId o interviewId", async () => {});

  it("restituisce 200 e salva l'attempt", async () => {});
});
