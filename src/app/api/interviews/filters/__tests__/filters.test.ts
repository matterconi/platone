import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import sql from "@/lib/db";
import { GET } from "../route";
import { NextRequest } from "next/server";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

function makeRequest() {
  return new NextRequest("http://localhost/api/interviews/filters");
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSql.mockReset();
});

// ─── GET ──────────────────────────────────────────────────────────────────────

describe("GET filters", () => {
  it("restituisce 401 se l'utente non è autenticato", async () => {});

  it("restituisce i filtri disponibili per l'utente", async () => {});

  it("restituisce array vuoti se non ci sono interviste", async () => {});
});
