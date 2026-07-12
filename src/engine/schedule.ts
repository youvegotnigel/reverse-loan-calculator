export interface YearRow {
  year: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
}

export interface Schedule {
  years: YearRow[];
  /** Balance after each payment; length n + 1, from principal down to 0. */
  monthlyBalances: number[];
}

/**
 * Standard reducing-balance amortization. The final payment absorbs any
 * floating-point drift so the closing balance is exactly zero.
 */
export function buildSchedule(
  principal: number,
  installment: number,
  monthlyRate: number,
  n: number,
): Schedule {
  const monthlyBalances: number[] = [principal];
  const years: YearRow[] = [];
  if (n <= 0 || principal <= 0) {
    return { years, monthlyBalances: [0] };
  }

  let balance = principal;
  let yearPrincipal = 0;
  let yearInterest = 0;

  for (let month = 1; month <= n; month++) {
    const interest = balance * monthlyRate;
    let principalPart = installment - interest;
    if (month === n) {
      principalPart = balance; // absorb rounding drift
    }
    balance = month === n ? 0 : balance - principalPart;
    yearPrincipal += principalPart;
    yearInterest += interest;
    monthlyBalances.push(balance);

    if (month % 12 === 0 || month === n) {
      years.push({
        year: years.length + 1,
        principalPaid: yearPrincipal,
        interestPaid: yearInterest,
        closingBalance: balance,
      });
      yearPrincipal = 0;
      yearInterest = 0;
    }
  }

  return { years, monthlyBalances };
}
