export interface LoanInputs {
  /** Net take-home salary in LKR per month. */
  monthlySalary: number;
  /** Percentage of salary committed to repayment (DSR), 0–100. */
  dsrPercent: number;
  /** Existing monthly loan commitments in LKR, deducted after DSR. */
  existingCommitments: number;
  years: number;
  months: number;
  /** Annual interest rate in percent, reducing balance. */
  annualRatePercent: number;
}

export interface LoanResult {
  /** Monthly repayment capacity after commitments (M). */
  monthlyInstallment: number;
  /** Maximum borrowable principal (P). */
  maxLoan: number;
  /** Number of monthly payments (n). */
  totalPayments: number;
  totalRepaid: number;
  totalInterest: number;
  principalSharePercent: number;
  interestSharePercent: number;
}

export function totalMonths(years: number, months: number): number {
  return years * 12 + months;
}

export function monthlyCapacity(salary: number, dsrPercent: number, commitments: number): number {
  return Math.max(0, salary * (dsrPercent / 100) - commitments);
}

/**
 * Reverse annuity: the principal P that a fixed installment M can service
 * over n payments at monthly rate i.
 *
 *   P = M * (1 - (1 + i)^-n) / i,   or  P = M * n  when i = 0.
 */
export function maxPrincipal(installment: number, monthlyRate: number, n: number): number {
  if (n <= 0 || installment <= 0) return 0;
  if (monthlyRate === 0) return installment * n;
  return (installment * (1 - Math.pow(1 + monthlyRate, -n))) / monthlyRate;
}

export function computeLoan(inputs: LoanInputs): LoanResult {
  const n = totalMonths(inputs.years, inputs.months);
  const installment = monthlyCapacity(
    inputs.monthlySalary,
    inputs.dsrPercent,
    inputs.existingCommitments,
  );
  const i = inputs.annualRatePercent / 100 / 12;
  const maxLoan = maxPrincipal(installment, i, n);
  const totalRepaid = maxLoan > 0 ? installment * n : 0;
  const totalInterest = totalRepaid - maxLoan;
  const principalSharePercent = totalRepaid > 0 ? (maxLoan / totalRepaid) * 100 : 0;
  return {
    monthlyInstallment: installment,
    maxLoan,
    totalPayments: n,
    totalRepaid,
    totalInterest,
    principalSharePercent,
    interestSharePercent: totalRepaid > 0 ? 100 - principalSharePercent : 0,
  };
}

export function stressTest(
  inputs: LoanInputs,
  rateBumpPercent: number,
): { maxLoan: number; drop: number } {
  const base = computeLoan(inputs).maxLoan;
  const bumped = computeLoan({
    ...inputs,
    annualRatePercent: inputs.annualRatePercent + rateBumpPercent,
  }).maxLoan;
  return { maxLoan: bumped, drop: base - bumped };
}
