import { amountInWords, formatLKR, formatPercent } from '../engine/format';
import { stressTest, type LoanResult } from '../engine/loan';
import { propertyAffordability, type AppInputs } from '../engine/property';
import { LIMITS, type InputStatus } from '../engine/validate';

const STRESS_BUMP = 2;

const EMPTY_MESSAGES: Record<Exclude<InputStatus, 'ok'>, string> = {
  'no-salary': 'Enter your monthly take-home salary to see your borrowing power.',
  'no-term': 'Set a loan period of at least one month to see your borrowing power.',
  'no-capacity':
    'Your existing commitments use up your whole repayment capacity. Lower them, or commit a larger share of salary.',
};

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

/* Count-up tween for the hero figure. */
let raf = 0;
let shownValue: number | null = null;

function animateFigure(el: HTMLElement, to: number): void {
  cancelAnimationFrame(raf);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || shownValue === null) {
    el.textContent = formatLKR(to);
    shownValue = to;
    return;
  }
  const from = shownValue;
  const start = performance.now();
  const duration = 300;
  const tick = (now: number) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = formatLKR(from + (to - from) * eased);
    if (progress < 1) {
      raf = requestAnimationFrame(tick);
    } else {
      shownValue = to;
    }
  };
  raf = requestAnimationFrame(tick);
}

export function renderResults(inputs: AppInputs, status: InputStatus, result: LoanResult): void {
  const plate = byId<HTMLDivElement>('note-plate');
  const figure = byId<HTMLElement>('max-loan');
  const words = byId<HTMLElement>('in-words');
  const empty = byId<HTMLElement>('empty-state');
  const stats = {
    installment: byId<HTMLElement>('installment'),
    totalRepaid: byId<HTMLElement>('total-repaid'),
    totalInterest: byId<HTMLElement>('total-interest'),
    payments: byId<HTMLElement>('payments-count'),
  };
  const propertyLine = byId<HTMLElement>('property-line');
  const capacityLine = byId<HTMLElement>('capacity-line');
  const split = byId<HTMLElement>('split');
  const splitBar = byId<HTMLElement>('split-bar');
  const splitPrincipalBar = byId<HTMLElement>('split-principal-bar');
  const splitPrincipalPct = byId<HTMLElement>('split-principal-pct');
  const splitInterestPct = byId<HTMLElement>('split-interest-pct');
  const stressLine = byId<HTMLElement>('stress-line');
  const sticky = byId<HTMLElement>('sticky-figure');

  if (status !== 'ok') {
    plate.classList.add('is-empty');
    empty.hidden = false;
    empty.textContent = EMPTY_MESSAGES[status];
    shownValue = null;
    for (const el of Object.values(stats)) el.textContent = '—';
    propertyLine.hidden = true;
    capacityLine.hidden = true;
    split.hidden = true;
    stressLine.hidden = true;
    sticky.textContent = '—';
    return;
  }

  plate.classList.remove('is-empty');
  empty.hidden = true;

  animateFigure(figure, result.maxLoan);
  words.textContent = amountInWords(result.maxLoan);
  sticky.textContent = formatLKR(result.maxLoan);

  stats.installment.textContent = formatLKR(result.monthlyInstallment);
  stats.totalRepaid.textContent = formatLKR(result.totalRepaid);
  stats.totalInterest.textContent = formatLKR(result.totalInterest);
  stats.payments.textContent = `${result.totalPayments} months`;

  if (inputs.propertyMode && result.maxLoan > 0) {
    const property = propertyAffordability(result.maxLoan, inputs.downPaymentPercent);
    propertyLine.hidden = false;
    propertyLine.innerHTML =
      `🏠 You could afford a property worth ` +
      `<strong class="num">${formatLKR(property.maxPropertyPrice)}</strong> — ` +
      `${formatLKR(property.downPaymentAmount)} down (${formatPercent(inputs.downPaymentPercent)}) ` +
      `plus the ${formatLKR(result.maxLoan)} loan.`;
  } else {
    propertyLine.hidden = true;
  }

  if (inputs.existingCommitments > 0) {
    const gross = inputs.monthlySalary * (inputs.dsrPercent / 100);
    capacityLine.hidden = false;
    capacityLine.textContent =
      `Of your ${formatLKR(gross)} repayment capacity, ` +
      `${formatLKR(inputs.existingCommitments)} already goes to existing commitments — ` +
      `${formatLKR(result.monthlyInstallment)} a month is left for this loan.`;
  } else {
    capacityLine.hidden = true;
  }

  split.hidden = false;
  const principalPct = result.principalSharePercent;
  splitPrincipalBar.style.width = `${principalPct}%`;
  splitPrincipalPct.textContent = formatPercent(principalPct, 0);
  splitInterestPct.textContent = formatPercent(result.interestSharePercent, 0);
  splitBar.setAttribute('role', 'img');
  splitBar.setAttribute(
    'aria-label',
    `Principal ${formatPercent(principalPct, 0)}, interest ${formatPercent(result.interestSharePercent, 0)} of total repaid`,
  );

  if (inputs.annualRatePercent + STRESS_BUMP <= LIMITS.rate.max && result.maxLoan > 0) {
    const stressed = stressTest(inputs, STRESS_BUMP);
    stressLine.hidden = false;
    stressLine.innerHTML =
      `If rates rise ${STRESS_BUMP}% (to ${formatPercent(inputs.annualRatePercent + STRESS_BUMP)}), ` +
      `your maximum drops to <strong class="num">${formatLKR(stressed.maxLoan)}</strong> — worth ` +
      `keeping in mind with a floating rate.`;
  } else {
    stressLine.hidden = true;
  }
}

/** Slide the compact result bar in whenever the Note is scrolled out of view. */
export function initStickyResult(): void {
  const plate = byId<HTMLDivElement>('note-plate');
  const bar = byId<HTMLDivElement>('sticky-result');
  bar.hidden = false;
  const observer = new IntersectionObserver(
    ([entry]) => {
      bar.classList.toggle('is-visible', entry ? !entry.isIntersecting : false);
    },
    { threshold: 0 },
  );
  observer.observe(plate);
}
