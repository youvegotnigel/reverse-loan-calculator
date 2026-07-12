import { amountInWords, formatLKR, formatPercent } from '@rlc/engine';
import { computeLoan } from '@rlc/engine';
import { propertyAffordability } from '@rlc/engine';
import { statusFor } from '@rlc/engine';
import { type Store } from '../state';

function flash(button: HTMLButtonElement, message: string): void {
  const original = button.textContent;
  button.textContent = message;
  button.disabled = true;
  setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
  }, 1600);
}

async function copy(button: HTMLButtonElement, text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    flash(button, 'Copied ✓');
  } catch {
    flash(button, 'Copy failed');
  }
}

function buildSummary(store: Store): string {
  const inputs = store.get();
  const result = computeLoan(inputs);
  const lines = [
    'Reverse Loan Calculator — Sri Lanka',
    '',
    `Salary: ${formatLKR(inputs.monthlySalary)}/month · Committed: ${formatPercent(inputs.dsrPercent)}` +
      (inputs.existingCommitments > 0
        ? ` · Existing commitments: ${formatLKR(inputs.existingCommitments)}/month`
        : ''),
    `Period: ${inputs.years}y ${inputs.months}m · Rate: ${formatPercent(inputs.annualRatePercent)} p.a. (reducing balance)`,
    '',
    `Maximum loan: ${formatLKR(result.maxLoan)} (${amountInWords(result.maxLoan)})`,
    `Monthly installment: ${formatLKR(result.monthlyInstallment)}`,
    `Total repaid: ${formatLKR(result.totalRepaid)} · Total interest: ${formatLKR(result.totalInterest)}`,
  ];
  if (inputs.propertyMode && result.maxLoan > 0) {
    const property = propertyAffordability(result.maxLoan, inputs.downPaymentPercent);
    lines.push(
      `Max property price: ${formatLKR(property.maxPropertyPrice)} ` +
        `(${formatPercent(inputs.downPaymentPercent)} down = ${formatLKR(property.downPaymentAmount)})`,
    );
  }
  lines.push('', window.location.href);
  return lines.join('\n');
}

export function initShare(store: Store): void {
  const copyLink = document.querySelector<HTMLButtonElement>('#copy-link');
  const copySummary = document.querySelector<HTMLButtonElement>('#copy-summary');

  copyLink?.addEventListener('click', () => {
    void copy(copyLink, window.location.href);
  });

  copySummary?.addEventListener('click', () => {
    if (statusFor(store.get()) !== 'ok') {
      flash(copySummary, 'Nothing to copy yet');
      return;
    }
    void copy(copySummary, buildSummary(store));
  });
}
