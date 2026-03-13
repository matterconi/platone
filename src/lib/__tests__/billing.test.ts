import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  default: vi.fn(),
}));

import sql from "@/lib/db";
import { applyTransaction, scheduleCancel, scheduleDowngrade, cancelSubscription } from "../billing";

const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockSql.mockReset();
  mockSql.mockResolvedValue([]);
});

// ─── applyTransaction ─────────────────────────────────────────────────────────

describe("applyTransaction", () => {
  it("aggiorna customerId e credits dell'utente", async () => {
    await applyTransaction("user_1", "cust_1", "pro", 350, "sub_1");

    expect(mockSql).toHaveBeenCalledTimes(2);
    expect(mockSql.mock.calls[0].slice(1)).toEqual(["cust_1", 350, "user_1"]);
  });

  it("inserisce o aggiorna la subscription con piano e stato active", async () => {
    await applyTransaction("user_1", "cust_1", "pro", 350, "sub_1");

    expect(mockSql.mock.calls[1].slice(1)).toEqual([
      "user_1", "pro", "active", "sub_1", "pro", "active"
    ])
  });
});

// ─── scheduleCancel ───────────────────────────────────────────────────────────

describe("scheduleCancel", () => {
  it("imposta next_plan = 'cancelled' per la subscription", async () => {

    await scheduleCancel("sub_1");

    expect(mockSql).toHaveBeenCalledTimes(1);
    expect(mockSql.mock.calls[0].slice(1)).toEqual(["cancelled", "sub_1"])
  });
});

// ─── scheduleDowngrade ────────────────────────────────────────────────────────

describe("scheduleDowngrade", () => {
  it("imposta next_plan = nextPlan dove il piano attuale è diverso", async () => {
    await scheduleDowngrade("sub_1", "casual");

    expect(mockSql).toHaveBeenCalledTimes(1);
    expect(mockSql.mock.calls[0].slice(1)).toEqual(["casual", "sub_1", "casual"])
  });
});

// ─── cancelSubscription ───────────────────────────────────────────────────────

describe("cancelSubscription", () => {
  it("imposta status = 'cancelled' e azzera i crediti dell'utente", async () => {
    await cancelSubscription("sub_1");

    expect(mockSql).toHaveBeenCalledTimes(2);
    expect(mockSql.mock.calls[0].slice(1)).toEqual(["cancelled", "sub_1"]);
    expect(mockSql.mock.calls[1].slice(1)).toEqual(["sub_1"]);
  });
});
