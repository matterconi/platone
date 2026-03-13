import { describe, it, expect } from "vitest";
import { getCreditsPerMinute, calculateCreditsToDeduct, DEFAULT_CREDITS_PER_MINUTE, ASSISTANT_CREDITS_PER_MINUTE } from "../credits";

describe("getCreditsPerMinute", () => {
  it("restituisce DEFAULT quando assistantId è undefined", () => {
    const result = getCreditsPerMinute();
    expect(result).toBe(DEFAULT_CREDITS_PER_MINUTE);
  });
  it("restituisce DEFAULT quando assistantId non è in mappa", () => {
    const result = getCreditsPerMinute("-1");
    expect(result).toBe(DEFAULT_CREDITS_PER_MINUTE)
  });
  it("tratta la stringa vuota come assenza di ID", () => {
    const result = getCreditsPerMinute("");
    expect(result).toBe(DEFAULT_CREDITS_PER_MINUTE);
  });

  it("restituisce il valore corretto per un assistantId noto", () => {
    ASSISTANT_CREDITS_PER_MINUTE["test-assistant"] = 5;

    const result = getCreditsPerMinute("test-assistant");
    expect(result).toBe(5);
    delete ASSISTANT_CREDITS_PER_MINUTE["test-assistant"];
  });
});

describe("calculateCreditsToDeduct", () => {
  it("90 secondi, 2 crediti/min → 4 crediti (ceil)", () => {
    expect(calculateCreditsToDeduct(90, 2)).toBe(4);
  });

  it("60 secondi esatti → 2 crediti", () => {
    expect(calculateCreditsToDeduct(60, 2)).toBe(2);
  });

  it("1 secondo → 2 crediti (ceil arrotonda a 1 minuto)", () => {
    expect(calculateCreditsToDeduct(1, 2)).toBe(2);
  });

  it("0 secondi → 0 crediti", () => {
    expect(calculateCreditsToDeduct(0, 2)).toBe(0);
  });
});
