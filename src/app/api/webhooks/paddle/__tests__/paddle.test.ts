import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// — vi.hoisted: rende mockUnmarshal disponibile dentro la factory di vi.mock —
const mockUnmarshal = vi.hoisted(() => vi.fn());

// — Mock delle dipendenze —
vi.mock("@paddle/paddle-node-sdk", () => ({
  Paddle: vi.fn(() => ({ webhooks: { unmarshal: mockUnmarshal } })),
  EventName: {
    TransactionCompleted: "transaction.completed",
    SubscriptionUpdated: "subscription.updated",
    SubscriptionCanceled: "subscription.canceled",
  },
}));
vi.mock("@/lib/billing", () => ({
  applyTransaction: vi.fn(),
  scheduleCancel: vi.fn(),
  scheduleDowngrade: vi.fn(),
  cancelSubscription: vi.fn(),
}));

// — Import dei moduli mockati —
import { applyTransaction, scheduleCancel, scheduleDowngrade, cancelSubscription } from "@/lib/billing";
import { POST } from "../route";

// — Cast a mock tipizzati —
const mockApplyTransaction = applyTransaction as ReturnType<typeof vi.fn>;
const mockScheduleCancel = scheduleCancel as ReturnType<typeof vi.fn>;
const mockScheduleDowngrade = scheduleDowngrade as ReturnType<typeof vi.fn>;
const mockCancelSubscription = cancelSubscription as ReturnType<typeof vi.fn>;

// — Helper: costruisce una NextRequest con paddle-signature —
function makeRequest(body = "{}") {
  return new NextRequest("http://localhost/api/webhooks/paddle", {
    method: "POST",
    headers: { "paddle-signature": "test-sig" },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Autenticazione ───────────────────────────────────────────────────────────

describe("autenticazione", () => {
  it("restituisce 401 se la firma è invalida", async () => {
    mockUnmarshal.mockRejectedValueOnce(new Error("bad signature"));

    const req = makeRequest();
    const res = await POST(req);

    expect(res.status).toBe(401);
  });
});

// ─── TransactionCompleted ─────────────────────────────────────────────────────

describe("transaction.completed", () => {
  it("", async () => {

  });
  it("restituisce 200 senza chiamate se i dati sono mancanti", async () => {
    mockUnmarshal.mockResolvedValueOnce({
      eventType: "transaction.completed",
      data: {
        subscriptionId: "sub_123",       
        customerId: "cus_abc",          
        customData: { clerkUserId: "user_123" },  
        items: [{ price: { id: "pri_01kk1pndq89nmbytffssa8sejw" } }],
      }
    });
    const req = makeRequest();
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockApplyTransaction).toHaveBeenCalledWith("user_123", "cus_abc", "casual", 100, "sub_123");
  });
});

// ─── SubscriptionUpdated ──────────────────────────────────────────────────────

describe("subscription.updated", () => {
  it("", async () => {
    mockUnmarshal.mockResolvedValueOnce({
      eventType: "subscription.updated",
      data: {
        id: "sub_123",  
        scheduledChange: { action: "cancel" },    
      }
    });
    const req = makeRequest();
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockScheduleCancel).toHaveBeenCalledWith("sub_123");
  });

  it("", async () => {
    mockUnmarshal.mockResolvedValueOnce({
      eventType: "subscription.updated",
      data: {
        id: "sub_123",
        items: [{ price: { id: "pri_01kk1pndq89nmbytffssa8sejw" } }]
      }
    });
    const req = makeRequest();
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockScheduleDowngrade).toHaveBeenCalledWith("sub_123", "casual");
  });
});

// ─── SubscriptionCanceled ─────────────────────────────────────────────────────

describe("subscription.canceled", () => {
  it("", async () => {
    mockUnmarshal.mockResolvedValueOnce({
      eventType: "subscription.canceled",
      data: {
        id: "sub_123",  
      }
    });
    const req = makeRequest();
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockCancelSubscription).toHaveBeenCalledWith("sub_123");
  });
});

// ─── Evento sconosciuto ───────────────────────────────────────────────────────

describe("evento sconosciuto", () => {
  it("restituisce 200 senza chiamare billing", async () => {
    mockUnmarshal.mockResolvedValueOnce({
      eventType: "customer.created",
      data: {},
    });
    const req = makeRequest();
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockApplyTransaction).not.toHaveBeenCalled();
    expect(mockScheduleCancel).not.toHaveBeenCalled();
    expect(mockScheduleDowngrade).not.toHaveBeenCalled();
    expect(mockCancelSubscription).not.toHaveBeenCalled();
  });
});
