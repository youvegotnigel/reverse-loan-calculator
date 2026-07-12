import { describe, expect, it } from 'vitest';

import { type LoanInputs } from './loan';
import { decodeState, encodeState } from './url-state';
import { DEFAULT_INPUTS, LIMITS } from './validate';

describe('encodeState / decodeState', () => {
  it('round-trips inputs through a query string', () => {
    const inputs: LoanInputs = {
      monthlySalary: 225_000,
      dsrPercent: 55,
      existingCommitments: 15_000,
      years: 7,
      months: 6,
      annualRatePercent: 9.75,
    };
    expect(decodeState(encodeState(inputs))).toEqual(inputs);
  });

  it('produces compact, readable keys', () => {
    expect(encodeState(DEFAULT_INPUTS)).toBe('s=150000&d=40&c=0&y=10&m=0&r=11.5');
  });

  it('falls back to defaults for an empty query', () => {
    expect(decodeState('')).toEqual(DEFAULT_INPUTS);
  });

  it('falls back per-field for garbage values', () => {
    const decoded = decodeState('s=hello&d=55&r=');
    expect(decoded.monthlySalary).toBe(DEFAULT_INPUTS.monthlySalary);
    expect(decoded.dsrPercent).toBe(55);
    expect(decoded.annualRatePercent).toBe(DEFAULT_INPUTS.annualRatePercent);
  });

  it('clamps out-of-range values', () => {
    const decoded = decodeState('s=99999999999&m=25&r=-4');
    expect(decoded.monthlySalary).toBe(LIMITS.salary.max);
    expect(decoded.months).toBe(LIMITS.months.max);
    expect(decoded.annualRatePercent).toBe(LIMITS.rate.min);
  });

  it('accepts a leading question mark', () => {
    expect(decodeState('?s=100000')).toMatchObject({ monthlySalary: 100_000 });
  });
});
