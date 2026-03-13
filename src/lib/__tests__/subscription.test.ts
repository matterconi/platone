import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserAccess, getRemainingSeconds } from "../subscription";

// Intercetta il modulo DB prima che venga importato dalla funzione.
// Ogni volta che il codice chiama sql`...`, viene chiamata questa funzione
// invece di andare al database reale.
vi.mock("@/lib/db", () => ({
  default: vi.fn(),
}));

// Importa il mock DOPO averlo dichiarato, così possiamo configurarlo
// nei singoli test con mockResolvedValue()
import sql from "@/lib/db";
const mockSql = sql as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  // Resetta il mock prima di ogni test per evitare contaminazioni
  mockSql.mockReset();
});

// ─── getUserAccess ────────────────────────────────────────────────────────────

describe("getUserAccess", () => {
  it("restituisce valori di default se l'utente non esiste nel DB", async () => {
    // Il DB non trova nessuna riga → array vuoto
    mockSql.mockResolvedValue([]);

    const result = await getUserAccess("user-inesistente");

    expect(result.hasActiveSubscription).toBe(false);
    expect(result.plan).toBe(null);
    expect(result.trialUsed).toBe(false);
    expect(result.credits).toBe(0);
  });

  it("utente senza subscription attiva → hasActiveSubscription: false", async () => {
    mockSql.mockResolvedValue([
      {trial_used: true,
      credits: 0,
      paddle_customer_id: null,
      plan: null,                   // ← nessun piano = no subscription
      status: null,
      starts_at: null,
      paddle_subscription_id: null,
      next_plan: null,}
    ])
    const result = await getUserAccess("user-123");
    expect(result.hasActiveSubscription).toBe(false);
    expect(result.plan).toBe(null);
    expect(result.trialUsed).toBe(true);
    expect(result.credits).toBe(0);
  });

  it("utente con subscription attiva → hasActiveSubscription: true + piano", async () => {
    mockSql.mockResolvedValue([
      {trial_used: true,
      credits: 100,
      paddle_customer_id: null,
      plan: "regular",                   
      status: "active",
      starts_at: null,
      paddle_subscription_id: "1234",
      next_plan: null,}
    ])
    const result = await getUserAccess("user-123");
    expect(result.hasActiveSubscription).toBe(true);
    expect(result.plan).toBe("regular");
    expect(result.trialUsed).toBe(true);
    expect(result.credits).toBe(100);
  });

  it("utente che ha usato la prova → trialUsed: true", async () => {
    mockSql.mockResolvedValue([
      {trial_used: true,
      credits: 0,
      paddle_customer_id: null,
      plan: null,                   // ← nessun piano = no subscription
      status: null,
      starts_at: null,
      paddle_subscription_id: null,
      next_plan: null,}
    ])
    const result = await getUserAccess("user-123");
    expect(result.trialUsed).toBe(true);
    expect(result.plan).toBe(null);
    expect(result.credits).toBe(0);
  });

  it("utente che ha non usato la prova → trialUsed: false", async () => {
    mockSql.mockResolvedValue([
      {trial_used: false,
      credits: 0,
      paddle_customer_id: null,
      plan: null,                   // ← nessun piano = no subscription
      status: null,
      starts_at: null,
      paddle_subscription_id: null,
      next_plan: null,}
    ])
    const result = await getUserAccess("user-123");
    expect(result.trialUsed).toBe(false);
    expect(result.plan).toBe(null);
    expect(result.credits).toBe(0);
  });
});

// ─── getRemainingSeconds ──────────────────────────────────────────────────────

describe("getRemainingSeconds", () => {
  it("100 crediti → 3000 secondi (50 minuti)", async () => {
    mockSql.mockResolvedValue([{ credits: 100 }]);

    const result = await getRemainingSeconds("user-123")
    expect(result).toBe(3000);
  });

  it("1 credito (meno di 1 minuto) → 0 secondi", async () => {
    mockSql.mockResolvedValue([{ credits: 1 }]);

    const result = await getRemainingSeconds("user-123")
    expect(result).toBe(0);
  });
  it("0 crediti → 0 secondi", async () => {
    mockSql.mockResolvedValue([{ credits: 0 }]);

    const result = await getRemainingSeconds("user-123")
    expect(result).toBe(0);
  });
});
