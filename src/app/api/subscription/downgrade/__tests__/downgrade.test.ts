import { describe, it, expect, vi, beforeEach } from "vitest";

// — vi.hoisted —
const mockAuth = vi.hoisted(() => vi.fn());
const mockGetUserAccess = vi.hoisted(() => vi.fn());
const mockSubscriptionsUpdate = vi.hoisted(() => vi.fn());

// — Mock delle dipendenze —
vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));
vi.mock("@/lib/subscription", () => ({
  getUserAccess: mockGetUserAccess,
}));
vi.mock("@paddle/paddle-node-sdk", () => ({
  Paddle: vi.fn(() => ({
    subscriptions: { update: mockSubscriptionsUpdate },
  })),
}));

// — Import della route —
import { POST } from "../route";

function makeRequest(body: unknown) {
  return { json: async () => body } as Request;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSubscriptionsUpdate.mockResolvedValue({});
});

// ─── Autenticazione ───────────────────────────────────────────────────────────

describe("autenticazione", () => {
  it("restituisce 401 se l'utente non è autenticato", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(401);
  });
});

// ─── Validazione priceId ──────────────────────────────────────────────────────

describe("validazione priceId", () => {
  it("restituisce 400 se priceId è mancante", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123" });
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });
  it("restituisce 400 se priceId non è valido", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123" });
    const res = await POST(makeRequest({ priceId: "pri_invalid" }));
    expect(res.status).toBe(400);
  });
});

// ─── Subscription non trovata ─────────────────────────────────────────────────

describe("subscription non trovata", () => {
  it("restituisce 404 se non c'è una subscription attiva", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123" });
    mockGetUserAccess.mockResolvedValue({ userId: "user_123", plan: "pro", paddleSubscriptionId: null });
    const res = await POST(makeRequest({ priceId: "pri_01kk1ptvd4ky1wtrn44awc72cv" }));
    expect(res.status).toBe(404);
  });
});

// ─── Validazione downgrade ────────────────────────────────────────────────────

describe("validazione downgrade", () => {
  it("restituisce 400 se il piano richiesto non è inferiore al piano attuale", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123" });
    mockGetUserAccess.mockResolvedValue({ userId: "user_123", plan: "casual", paddleSubscriptionId: "sub_123" });
    const res = await POST(makeRequest({ priceId: "pri_01kk1ptvd4ky1wtrn44awc72cv" }));
    expect(res.status).toBe(400);
  });
});

// ─── Downgrade ────────────────────────────────────────────────────────────────

describe("downgrade", () => {
  it("chiama paddle.subscriptions.update e restituisce 200", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123" });
    mockGetUserAccess.mockResolvedValue({ userId: "user_123", plan: "pro", paddleSubscriptionId: "sub_123"  });
    const res = await POST(makeRequest({ priceId: "pri_01kk1pndq89nmbytffssa8sejw" }));
    expect(res.status).toBe(200);
    expect(mockSubscriptionsUpdate).toHaveBeenCalledWith("sub_123", {
      items: [{ priceId: "pri_01kk1pndq89nmbytffssa8sejw", quantity: 1 }],
      prorationBillingMode: "do_not_bill",
    });
  });
});
