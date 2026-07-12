import { describe, expect, it } from 'vitest';

import { amountInWords, formatLKR, formatPercent } from './format';

describe('formatLKR', () => {
  it('formats with Rs. prefix and grouping', () => {
    expect(formatLKR(8_842_190)).toBe('Rs. 8,842,190');
  });

  it('rounds to whole rupees', () => {
    expect(formatLKR(1234.56)).toBe('Rs. 1,235');
  });

  it('handles zero', () => {
    expect(formatLKR(0)).toBe('Rs. 0');
  });
});

describe('formatPercent', () => {
  it('trims trailing zeros by default', () => {
    expect(formatPercent(11.5)).toBe('11.5%');
    expect(formatPercent(40)).toBe('40%');
  });

  it('respects explicit decimal places', () => {
    expect(formatPercent(81.267, 1)).toBe('81.3%');
  });
});

describe('amountInWords', () => {
  it('uses millions at or above one million', () => {
    expect(amountInWords(8_800_000)).toBe('about 8.8 million rupees');
  });

  it('drops the decimal for round millions', () => {
    expect(amountInWords(12_000_000)).toBe('about 12 million rupees');
  });

  it('uses lakhs between one lakh and one million', () => {
    expect(amountInWords(550_000)).toBe('about 5.5 lakhs');
  });

  it('uses a single lakh without pluralising', () => {
    expect(amountInWords(100_000)).toBe('about 1 lakh');
  });

  it('uses plain rupees below one lakh', () => {
    expect(amountInWords(85_000)).toBe('about 85,000 rupees');
  });

  it('handles tiny amounts gracefully', () => {
    expect(amountInWords(500)).toBe('less than a thousand rupees');
  });
});
