import { describe, expect, it } from 'vitest';

import { clampField, DEFAULT_INPUTS, LIMITS, statusFor } from './validate';

describe('clampField', () => {
  it('clamps to the field range', () => {
    expect(clampField('salary', -5)).toBe(LIMITS.salary.min);
    expect(clampField('salary', 99_000_000)).toBe(LIMITS.salary.max);
    expect(clampField('dsr', 150)).toBe(LIMITS.dsr.max);
    expect(clampField('months', 12)).toBe(LIMITS.months.max);
  });

  it('passes through in-range values', () => {
    expect(clampField('rate', 11.5)).toBe(11.5);
    expect(clampField('years', 10)).toBe(10);
  });

  it('maps NaN to the field minimum', () => {
    expect(clampField('salary', Number.NaN)).toBe(LIMITS.salary.min);
    expect(clampField('rate', Number.NaN)).toBe(LIMITS.rate.min);
  });
});

describe('statusFor', () => {
  it('is ok for the defaults', () => {
    expect(statusFor(DEFAULT_INPUTS)).toBe('ok');
  });

  it('flags missing salary first', () => {
    expect(statusFor({ ...DEFAULT_INPUTS, monthlySalary: 0, years: 0, months: 0 })).toBe(
      'no-salary',
    );
  });

  it('flags a zero term', () => {
    expect(statusFor({ ...DEFAULT_INPUTS, years: 0, months: 0 })).toBe('no-term');
  });

  it('flags commitments that consume all capacity', () => {
    expect(statusFor({ ...DEFAULT_INPUTS, existingCommitments: 60_000 })).toBe('no-capacity');
    expect(statusFor({ ...DEFAULT_INPUTS, existingCommitments: 999_999 })).toBe('no-capacity');
  });

  it('prioritises no-term over no-capacity', () => {
    expect(
      statusFor({ ...DEFAULT_INPUTS, years: 0, months: 0, existingCommitments: 999_999 }),
    ).toBe('no-term');
  });
});
