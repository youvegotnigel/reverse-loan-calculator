import { type LoanInputs } from './loan';
import { clampField, DEFAULT_INPUTS, type LimitField } from './validate';

const PARAM_MAP: ReadonlyArray<[key: string, field: keyof LoanInputs, limit: LimitField]> = [
  ['s', 'monthlySalary', 'salary'],
  ['d', 'dsrPercent', 'dsr'],
  ['c', 'existingCommitments', 'commitments'],
  ['y', 'years', 'years'],
  ['m', 'months', 'months'],
  ['r', 'annualRatePercent', 'rate'],
];

export function encodeState(inputs: LoanInputs): string {
  const params = new URLSearchParams();
  for (const [key, field] of PARAM_MAP) {
    params.set(key, String(inputs[field]));
  }
  return params.toString();
}

export function decodeState(query: string): LoanInputs {
  const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
  const inputs = { ...DEFAULT_INPUTS };
  for (const [key, field, limit] of PARAM_MAP) {
    const raw = params.get(key);
    if (raw === null || raw.trim() === '') continue;
    const value = Number(raw);
    inputs[field] = Number.isNaN(value) ? DEFAULT_INPUTS[field] : clampField(limit, value);
  }
  return inputs;
}
