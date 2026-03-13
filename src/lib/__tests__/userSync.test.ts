import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  default: vi.fn(),
}));

import sql from "@/lib/db";
import { createUser, updateUser, deleteUser } from "../userSync";

const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockSql.mockReset();
  mockSql.mockResolvedValue([]);
});

// ─── createUser ───────────────────────────────────────────────────────────────

describe("createUser", () => {
  it("Inserisce id, name, email nel DB", async () => {
    await createUser("user_123", "Mario Rossi", "mario@example.com");

    expect(mockSql).toHaveBeenCalledTimes(1);
    expect(mockSql.mock.calls[0].slice(1)).toEqual(["user_123", "Mario Rossi", "mario@example.com"]);
  });
});

// ─── updateUser ───────────────────────────────────────────────────────────────

describe("updateUser", () => {
  it("aggiorna name e email per id", async () => {
    await updateUser("user_123", "Mario Rossi", "mario@example.com");

    expect(mockSql).toHaveBeenCalledTimes(1);
    expect(mockSql.mock.calls[0].slice(1)).toEqual(["Mario Rossi", "mario@example.com", "user_123"]);
  });
});

// ─── deleteUser ───────────────────────────────────────────────────────────────

describe("deleteUser", () => {
  it("elimina l'utente per id", async () => {
    await deleteUser("user_123");

    expect(mockSql).toHaveBeenCalledTimes(1);
    expect(mockSql.mock.calls[0].slice(1)).toEqual(["user_123"]);
  });
});
