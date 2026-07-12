import { describe, expect, it } from 'vitest';

import { type AppInputs } from './property';
import { decodeState, encodeState } from './url-state';
import { DEFAULT_APP_INPUTS, LIMITS } from './validate';

describe('encodeState / decodeState', () => {
  it('round-trips inputs through a query string', () => {
    const inputs: AppInputs = {
      monthlySalary: 225_000,
      dsrPercent: 55,
      existingCommitments: 15_000,
      years: 7,
      months: 6,
      annualRatePercent: 9.75,
      propertyMode: true,
      downPaymentPercent: 25,
    };
    expect(decodeState(encodeState(inputs))).toEqual(inputs);
  });

  it('produces compact keys and omits property params while the mode is off', () => {
    expect(encodeState(DEFAULT_APP_INPUTS)).toBe('s=150000&d=40&c=0&y=10&m=0&r=11.5');
  });

  it('includes property params when the mode is on', () => {
    const encoded = encodeState({ ...DEFAULT_APP_INPUTS, propertyMode: true });
    expect(encoded).toContain('pp=1');
    expect(encoded).toContain('dp=20');
  });

  it('falls back to defaults for an empty query', () => {
    expect(decodeState('')).toEqual(DEFAULT_APP_INPUTS);
  });

  it('falls back per-field for garbage values', () => {
    const decoded = decodeState('s=hello&d=55&r=');
    expect(decoded.monthlySalary).toBe(DEFAULT_APP_INPUTS.monthlySalary);
    expect(decoded.dsrPercent).toBe(55);
    expect(decoded.annualRatePercent).toBe(DEFAULT_APP_INPUTS.annualRatePercent);
  });

  it('decodes and clamps property params', () => {
    const decoded = decodeState('pp=1&dp=95');
    expect(decoded.propertyMode).toBe(true);
    expect(decoded.downPaymentPercent).toBe(LIMITS.downPayment.max);
    expect(decodeState('').propertyMode).toBe(false);
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
