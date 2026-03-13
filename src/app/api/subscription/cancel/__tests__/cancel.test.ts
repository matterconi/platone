import { describe, it, expect, vi, beforeEach } from "vitest";

// — vi.hoisted —
const mockAuth = vi.hoisted(() => vi.fn());
const mockGetActiveSubscriptionId = vi.hoisted(() => vi.fn());
const mockSubscriptionsCancel = vi.hoisted(() => vi.fn());

// — Mock delle dipendenze —
vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));
vi.mock("@/lib/subscription", () => ({
  getActiveSubscriptionId: mockGetActiveSubscriptionId,
}));
vi.mock("@paddle/paddle-node-sdk", () => ({
  Paddle: vi.fn(() => ({
    subscriptions: { cancel: mockSubscriptionsCancel },
  })),
}));

// — Import della route —
import { POST } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
  mockSubscriptionsCancel.mockResolvedValue({});
});

// ─── Autenticazione ───────────────────────────────────────────────────────────

describe("autenticazione", () => {
  it("restituisce 401 se l'utente non è autenticato", async () => {
    mockAuth.mockResolvedValue( { userId: null });

    const res = await POST();

    expect(res.status).toBe(401);
  });
});

// ─── Subscription non trovata ─────────────────────────────────────────────────

describe("subscription non trovata", () => {
  it("restituisce 404 se non c'è una subscription attiva", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockGetActiveSubscriptionId.mockResolvedValue(null);

    const res = await POST();

    expect(res.status).toBe(404);
  });
});

// ─── Cancellazione ────────────────────────────────────────────────────────────

describe("cancellazione", () => {
  it("chiama paddle.subscriptions.cancel e restituisce 200", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockGetActiveSubscriptionId.mockResolvedValue("sub_1");

    const res = await POST();

    expect(res.status).toBe(200);
    expect(mockSubscriptionsCancel).toHaveBeenCalledWith("sub_1", {
      effectiveFrom: "next_billing_period"
    })
  });
});
