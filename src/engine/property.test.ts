import { describe, expect, it } from 'vitest';

import { propertyAffordability } from './property';

describe('propertyAffordability', () => {
  it('derives max property price from the loan and down payment share', () => {
    // Rs. 8M loan with 20% down: loan covers 80% → price = 8M / 0.8 = 10M
    const r = propertyAffordability(8_000_000, 20);
    expect(r.maxPropertyPrice).toBeCloseTo(10_000_000, 2);
    expect(r.downPaymentAmount).toBeCloseTo(2_000_000, 2);
  });

  it('with no down payment the price equals the loan', () => {
    const r = propertyAffordability(8_000_000, 0);
    expect(r.maxPropertyPrice).toBe(8_000_000);
    expect(r.downPaymentAmount).toBe(0);
  });

  it('price plus nothing: loan + down payment always equals price', () => {
    const r = propertyAffordability(7_654_321, 35);
    expect(r.maxPropertyPrice).toBeCloseTo(r.downPaymentAmount + 7_654_321, 6);
  });

  it('clamps absurd down payment shares instead of dividing by zero', () => {
    const r = propertyAffordability(8_000_000, 100);
    expect(Number.isFinite(r.maxPropertyPrice)).toBe(true);
    const r2 = propertyAffordability(8_000_000, 150);
    expect(Number.isFinite(r2.maxPropertyPrice)).toBe(true);
  });

  it('returns zeros for a zero loan', () => {
    const r = propertyAffordability(0, 20);
    expect(r.maxPropertyPrice).toBe(0);
    expect(r.downPaymentAmount).toBe(0);
  });
});
