import { type LoanInputs } from './loan';

export interface PropertyInputs {
  /** Whether the property purchase (LTV) mode is on. */
  propertyMode: boolean;
  /** Down payment as a percentage of the property price, 0–90. */
  downPaymentPercent: number;
}

/** Full app input state: loan inputs plus the optional property mode. */
export interface AppInputs extends LoanInputs, PropertyInputs {}

/** Down payments beyond this are clamped — banks don't finance slivers. */
export const MAX_DOWN_PAYMENT_PERCENT = 90;

/**
 * The bank lends `maxLoan`; a down payment of d% means the loan covers
 * (100 − d)% of the price, so price = loan / (1 − d/100).
 */
export function propertyAffordability(
  maxLoan: number,
  downPaymentPercent: number,
): { maxPropertyPrice: number; downPaymentAmount: number } {
  if (maxLoan <= 0) {
    return { maxPropertyPrice: 0, downPaymentAmount: 0 };
  }
  const dp = Math.min(MAX_DOWN_PAYMENT_PERCENT, Math.max(0, downPaymentPercent));
  const maxPropertyPrice = maxLoan / (1 - dp / 100);
  return { maxPropertyPrice, downPaymentAmount: maxPropertyPrice - maxLoan };
}
