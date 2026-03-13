import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ default: vi.fn() }));

import sql from "@/lib/db";
import { GET } from "../route";

const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockSql.mockReset();
});

// ─── GET ──────────────────────────────────────────────────────────────────────

describe("GET community interviews", () => {
  it("restituisce 200 con le ultime 6 interviste finalizzate", async () => {
    const rows = [
      { id: "1", role: "Frontend", type: "technical", level: "mid", techstack: ["React"], created_at: "2024-01-01T00:00:00.000Z" },
    ];
    mockSql.mockResolvedValueOnce(rows);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(rows);
  });

  it("restituisce 500 in caso di errore DB", async () => {
    mockSql.mockRejectedValueOnce(new Error("DB error"));

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
  });
});
