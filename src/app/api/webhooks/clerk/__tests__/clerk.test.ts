import { describe, it, expect, vi, beforeEach } from "vitest";

// — vi.hoisted: rende mockVerify disponibile dentro la factory di vi.mock —
const mockVerify = vi.hoisted(() => vi.fn());
const mockHeaders = vi.hoisted(() => vi.fn());

// — Mock delle dipendenze —
vi.mock("svix", () => ({
  Webhook: vi.fn(() => ({ verify: mockVerify })),
}));
vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));
vi.mock("@/lib/userSync", () => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

// — Import dei moduli mockati —
import { createUser, updateUser, deleteUser } from "@/lib/userSync";
import { POST } from "../route";

// — Cast a mock tipizzati —
const mockCreateUser = createUser as ReturnType<typeof vi.fn>;
const mockUpdateUser = updateUser as ReturnType<typeof vi.fn>;
const mockDeleteUser = deleteUser as ReturnType<typeof vi.fn>;

// — Helper: configura headers svix validi —
function mockValidHeaders() {
  mockHeaders.mockResolvedValue({
    get: (key: string) => ({
      "svix-id": "id_1",
      "svix-timestamp": "12345",
      "svix-signature": "sig_1",
    }[key] ?? null),
  });
}

// — Helper: costruisce una Request con body JSON —
function makeRequest(body = "{}") {
  return new Request("http://localhost/api/webhooks/clerk", {
    method: "POST",
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CLERK_WEBHOOK_SECRET = "test_secret";
});

// ─── Autenticazione ───────────────────────────────────────────────────────────

describe("autenticazione", () => {
  it("restituisce 500 se manca CLERK_WEBHOOK_SECRET", async () => {
    delete process.env.CLERK_WEBHOOK_SECRET;

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
  });

  it("restituisce 400 se mancano gli header svix", async () => {
    mockHeaders.mockResolvedValue({
      get: () => null,
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
  });

  it("restituisce 400 se la firma è invalida", async () => {
    mockValidHeaders();
    mockVerify.mockImplementationOnce(() => { throw new Error("bad signature"); });

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
  });
});

// ─── user.created ─────────────────────────────────────────────────────────────

describe("user.created", () => {
  it("chiama createUser con id, nome completo ed email", async () => {
    mockValidHeaders();
    mockVerify.mockReturnValueOnce({
      type: "user.created",
      data: {
        id: "user_1",
        first_name: "Mario",
        last_name: "Rossi",
        email_addresses: [{ email_address: "mario@example.com" }],
      },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockCreateUser).toHaveBeenCalledWith("user_1", "Mario Rossi", "mario@example.com");
  });
});

// ─── user.updated ─────────────────────────────────────────────────────────────

describe("user.updated", () => {
  it("chiama updateUser con id, nome aggiornato ed email", async () => {
    mockValidHeaders();
    mockVerify.mockReturnValueOnce({
      type: "user.updated",
      data: {
        id: "user_1",
        first_name: "Mario",
        last_name: "Rossi",
        email_addresses: [{ email_address: "mario@example.com" }],
      },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockUpdateUser).toHaveBeenCalledWith("user_1", "Mario Rossi", "mario@example.com");
  });
});

// ─── user.deleted ─────────────────────────────────────────────────────────────

describe("user.deleted", () => {
  it("chiama deleteUser con id", async () => {
    mockValidHeaders();
    mockVerify.mockReturnValueOnce({
      type: "user.deleted",
      data: {
        id: "user_1",
      },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockDeleteUser).toHaveBeenCalledWith("user_1");
  });
});
