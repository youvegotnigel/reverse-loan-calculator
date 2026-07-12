import { describe, expect, it } from 'vitest';

import { maxPrincipal } from './loan';
import { buildSchedule } from './schedule';

describe('buildSchedule', () => {
  const i = 0.01; // 12% p.a.
  const m = 10_000;
  const n = 12;
  const p = maxPrincipal(m, i, n);

  it('starts at the principal and ends at exactly zero', () => {
    const s = buildSchedule(p, m, i, n);
    expect(s.monthlyBalances).toHaveLength(n + 1);
    expect(s.monthlyBalances[0]).toBe(p);
    expect(s.monthlyBalances[n]).toBe(0);
  });

  it('yearly principal sums to the loan amount', () => {
    const s = buildSchedule(p, m, i, n);
    const principalSum = s.years.reduce((acc, y) => acc + y.principalPaid, 0);
    expect(principalSum).toBeCloseTo(p, 1);
  });

  it('yearly interest sums to total interest', () => {
    const s = buildSchedule(p, m, i, n);
    const interestSum = s.years.reduce((acc, y) => acc + y.interestPaid, 0);
    expect(interestSum).toBeCloseTo(m * n - p, 1);
  });

  it('splits a partial final year into its own row', () => {
    const n18 = 18;
    const p18 = maxPrincipal(m, i, n18);
    const s = buildSchedule(p18, m, i, n18);
    expect(s.years).toHaveLength(2);
    expect(s.years[0]?.year).toBe(1);
    expect(s.years[1]?.year).toBe(2);
    expect(s.years[1]?.closingBalance).toBe(0);
  });

  it('handles 0% interest with a linear balance decay', () => {
    const s = buildSchedule(120_000, 10_000, 0, 12);
    expect(s.monthlyBalances[6]).toBeCloseTo(60_000, 6);
    expect(s.years[0]?.interestPaid).toBe(0);
    expect(s.years[0]?.closingBalance).toBe(0);
  });

  it('returns an empty schedule for a zero-term loan', () => {
    const s = buildSchedule(0, 0, 0.01, 0);
    expect(s.years).toHaveLength(0);
    expect(s.monthlyBalances).toEqual([0]);
  });

  it('later years pay more principal than earlier years (reducing balance)', () => {
    const n60 = 60;
    const p60 = maxPrincipal(m, i, n60);
    const s = buildSchedule(p60, m, i, n60);
    const first = s.years[0]?.principalPaid ?? 0;
    const last = s.years[4]?.principalPaid ?? 0;
    expect(last).toBeGreaterThan(first);
  });
});
