import { monthlyCapacity, totalMonths, type LoanInputs } from './loan';

export const LIMITS = {
  salary: { min: 0, max: 10_000_000 },
  dsr: { min: 1, max: 100 },
  commitments: { min: 0, max: 10_000_000 },
  years: { min: 0, max: 40 },
  months: { min: 0, max: 11 },
  rate: { min: 0, max: 36 },
} as const;

export type LimitField = keyof typeof LIMITS;

export const DEFAULT_INPUTS: LoanInputs = {
  monthlySalary: 150_000,
  dsrPercent: 40,
  existingCommitments: 0,
  years: 10,
  months: 0,
  annualRatePercent: 11.5,
};

export function clampField(field: LimitField, value: number): number {
  const { min, max } = LIMITS[field];
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export type InputStatus = 'ok' | 'no-salary' | 'no-term' | 'no-capacity';

export function statusFor(inputs: LoanInputs): InputStatus {
  if (inputs.monthlySalary <= 0) return 'no-salary';
  if (totalMonths(inputs.years, inputs.months) <= 0) return 'no-term';
  if (monthlyCapacity(inputs.monthlySalary, inputs.dsrPercent, inputs.existingCommitments) <= 0) {
    return 'no-capacity';
  }
  return 'ok';
}
