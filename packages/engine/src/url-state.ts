import { type AppInputs } from './property';
import { clampField, DEFAULT_APP_INPUTS, type LimitField } from './validate';

type NumericField = Exclude<keyof AppInputs, 'propertyMode'>;

const PARAM_MAP: ReadonlyArray<[key: string, field: NumericField, limit: LimitField]> = [
  ['s', 'monthlySalary', 'salary'],
  ['d', 'dsrPercent', 'dsr'],
  ['c', 'existingCommitments', 'commitments'],
  ['y', 'years', 'years'],
  ['m', 'months', 'months'],
  ['r', 'annualRatePercent', 'rate'],
];

const PROPERTY_PARAMS: ReadonlyArray<[key: string, field: NumericField, limit: LimitField]> = [
  ['dp', 'downPaymentPercent', 'downPayment'],
];

export function encodeState(inputs: AppInputs): string {
  const params = new URLSearchParams();
  for (const [key, field] of PARAM_MAP) {
    params.set(key, String(inputs[field]));
  }
  if (inputs.propertyMode) {
    params.set('pp', '1');
    for (const [key, field] of PROPERTY_PARAMS) {
      params.set(key, String(inputs[field]));
    }
  }
  return params.toString();
}

export function decodeState(query: string): AppInputs {
  const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
  const inputs = { ...DEFAULT_APP_INPUTS };
  for (const [key, field, limit] of [...PARAM_MAP, ...PROPERTY_PARAMS]) {
    const raw = params.get(key);
    if (raw === null || raw.trim() === '') continue;
    const value = Number(raw);
    inputs[field] = Number.isNaN(value) ? DEFAULT_APP_INPUTS[field] : clampField(limit, value);
  }
  inputs.propertyMode = params.get('pp') === '1';
  return inputs;
}
