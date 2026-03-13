import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/subscription", () => ({ getUserAccess: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { getUserAccess } from "@/lib/subscription";
import { GET } from "../route";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockGetUserAccess = getUserAccess as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── GET ──────────────────────────────────────────────────────────────────────

describe("GET usage", () => {
  it("restituisce 401 se l'utente non è autenticato", async () => {
    mockAuth.mockResolvedValueOnce({ userId: null });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("restituisce plan:null se non ha subscription attiva", async () => {
    mockAuth.mockResolvedValueOnce({ userId: "user_123" });
    mockGetUserAccess.mockResolvedValueOnce({ hasActiveSubscription: false, plan: null });
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ plan: null, credits: 0, remainingMinutes: 0 })
  });

  it("restituisce plan, credits e remainingMinutes se ha subscription attiva", async () => {
    mockAuth.mockResolvedValueOnce({ userId: "user_123" });
    mockGetUserAccess.mockResolvedValueOnce({ hasActiveSubscription: true, plan: "pro", credits: 200 });
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ plan: "pro", credits: 200, remainingMinutes: 100 })
  });
});
