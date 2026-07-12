import { describe, expect, it } from 'vitest';

import {
  computeLoan,
  maxPrincipal,
  monthlyCapacity,
  stressTest,
  totalMonths,
  type LoanInputs,
} from './loan';

const BASE: LoanInputs = {
  monthlySalary: 150_000,
  dsrPercent: 40,
  existingCommitments: 0,
  years: 10,
  months: 0,
  annualRatePercent: 11.5,
};

describe('totalMonths', () => {
  it('combines years and months', () => {
    expect(totalMonths(10, 0)).toBe(120);
    expect(totalMonths(1, 6)).toBe(18);
    expect(totalMonths(0, 0)).toBe(0);
  });
});

describe('monthlyCapacity', () => {
  it('applies DSR percentage to salary', () => {
    expect(monthlyCapacity(150_000, 40, 0)).toBe(60_000);
  });

  it('deducts existing commitments', () => {
    expect(monthlyCapacity(150_000, 40, 20_000)).toBe(40_000);
  });

  it('never goes negative', () => {
    expect(monthlyCapacity(150_000, 40, 100_000)).toBe(0);
  });
});

describe('maxPrincipal', () => {
  it('matches the annuity formula for a known value (12% p.a., 12 months)', () => {
    // P = 10000 * (1 - 1.01^-12) / 0.01 = 112,550.77
    expect(maxPrincipal(10_000, 0.01, 12)).toBeCloseTo(112_550.77, 0);
  });

  it('handles 0% interest as M * n', () => {
    expect(maxPrincipal(10_000, 0, 12)).toBe(120_000);
  });

  it('round-trips through the forward installment formula', () => {
    const i = 0.115 / 12;
    const n = 120;
    const p = maxPrincipal(60_000, i, n);
    const forward = (p * i) / (1 - Math.pow(1 + i, -n));
    expect(forward).toBeCloseTo(60_000, 6);
  });

  it('returns 0 when there are no payments or no installment', () => {
    expect(maxPrincipal(10_000, 0.01, 0)).toBe(0);
    expect(maxPrincipal(0, 0.01, 120)).toBe(0);
  });
});

describe('computeLoan', () => {
  it('assembles the full result', () => {
    const r = computeLoan(BASE);
    expect(r.monthlyInstallment).toBe(60_000);
    expect(r.totalPayments).toBe(120);
    expect(r.totalRepaid).toBeCloseTo(60_000 * 120, 2);
    expect(r.maxLoan).toBeGreaterThan(0);
    expect(r.totalInterest).toBeCloseTo(r.totalRepaid - r.maxLoan, 2);
    expect(r.principalSharePercent + r.interestSharePercent).toBeCloseTo(100, 6);
  });

  it('borrowing power shrinks as the rate rises', () => {
    const low = computeLoan({ ...BASE, annualRatePercent: 8 });
    const high = computeLoan({ ...BASE, annualRatePercent: 16 });
    expect(high.maxLoan).toBeLessThan(low.maxLoan);
  });

  it('at 0% the max loan is exactly installment times payments', () => {
    const r = computeLoan({ ...BASE, annualRatePercent: 0 });
    expect(r.maxLoan).toBe(60_000 * 120);
    expect(r.totalInterest).toBe(0);
    expect(r.principalSharePercent).toBe(100);
  });

  it('zero-term loans produce a zeroed result instead of NaN', () => {
    const r = computeLoan({ ...BASE, years: 0, months: 0 });
    expect(r.maxLoan).toBe(0);
    expect(r.totalRepaid).toBe(0);
    expect(Number.isNaN(r.principalSharePercent)).toBe(false);
  });
});

describe('stressTest', () => {
  it('reports the drop in borrowing power when rates rise', () => {
    const { maxLoan, drop } = stressTest(BASE, 2);
    const base = computeLoan(BASE).maxLoan;
    const bumped = computeLoan({ ...BASE, annualRatePercent: 13.5 }).maxLoan;
    expect(maxLoan).toBeCloseTo(bumped, 6);
    expect(drop).toBeCloseTo(base - bumped, 6);
    expect(drop).toBeGreaterThan(0);
  });
});
