const rupees = new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 });

/** "Rs. 8,842,190" — whole rupees, Sri Lankan grouping. */
export function formatLKR(amount: number): string {
  return `Rs. ${rupees.format(Math.round(amount))}`;
}

export function formatPercent(value: number, dp?: number): string {
  if (dp === undefined) {
    return `${Number(value.toFixed(2))}%`;
  }
  return `${value.toFixed(dp)}%`;
}

function trimmed(value: number): string {
  return String(Number(value.toFixed(1)));
}

/** Plain-words amount following Sri Lankan conventions (lakhs and millions). */
export function amountInWords(amount: number): string {
  if (amount >= 1_000_000) {
    return `about ${trimmed(amount / 1_000_000)} million rupees`;
  }
  if (amount >= 100_000) {
    const lakhs = amount / 100_000;
    const text = trimmed(lakhs);
    return `about ${text} ${text === '1' ? 'lakh' : 'lakhs'}`;
  }
  if (amount >= 1_000) {
    return `about ${rupees.format(Math.round(amount))} rupees`;
  }
  return 'less than a thousand rupees';
}
