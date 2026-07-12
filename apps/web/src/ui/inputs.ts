import { type AppInputs } from '@rlc/engine';
import { clampField, type LimitField } from '@rlc/engine';
import { type Store } from '../state';

const grouping = new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 });

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

function parseMoney(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  return digits === '' ? Number.NaN : Number(digits);
}

function setFill(range: HTMLInputElement): void {
  const min = Number(range.min);
  const max = Number(range.max);
  const pct = ((Number(range.value) - min) / (max - min)) * 100;
  range.style.setProperty('--fill', `${pct}%`);
}

function bindMoney(
  input: HTMLInputElement,
  field: 'monthlySalary' | 'existingCommitments',
  limit: LimitField,
  store: Store,
): void {
  input.addEventListener('input', () => {
    const parsed = parseMoney(input.value);
    store.set({ [field]: Number.isNaN(parsed) ? 0 : clampField(limit, parsed) });
  });
  input.addEventListener('blur', () => {
    input.value = grouping.format(store.get()[field]);
  });
}

function bindPair(
  range: HTMLInputElement,
  number: HTMLInputElement,
  field: 'dsrPercent' | 'annualRatePercent' | 'downPaymentPercent',
  limit: LimitField,
  store: Store,
): void {
  range.addEventListener('input', () => {
    const value = Number(range.value);
    number.value = range.value;
    setFill(range);
    store.set({ [field]: value });
  });

  number.addEventListener('input', () => {
    const value = Number(number.value);
    if (number.value === '' || Number.isNaN(value)) return;
    const clamped = clampField(limit, value);
    range.value = String(clamped);
    setFill(range);
    store.set({ [field]: clamped });
  });

  number.addEventListener('change', () => {
    const clamped = clampField(limit, Number(number.value));
    number.value = String(clamped);
    range.value = String(clamped);
    setFill(range);
    store.set({ [field]: clamped });
  });
}

function bindCount(
  input: HTMLInputElement,
  field: 'years' | 'months',
  limit: LimitField,
  store: Store,
): void {
  input.addEventListener('input', () => {
    const value = Number(input.value);
    if (input.value === '' || Number.isNaN(value)) {
      store.set({ [field]: 0 });
      return;
    }
    store.set({ [field]: clampField(limit, Math.floor(value)) });
  });
  input.addEventListener('change', () => {
    input.value = String(store.get()[field]);
  });
}

export function bindInputs(store: Store): void {
  const salary = byId<HTMLInputElement>('salary');
  const commitments = byId<HTMLInputElement>('commitments');
  const dsrRange = byId<HTMLInputElement>('dsr-range');
  const dsrNumber = byId<HTMLInputElement>('dsr-number');
  const years = byId<HTMLInputElement>('years');
  const months = byId<HTMLInputElement>('months');
  const rateRange = byId<HTMLInputElement>('rate-range');
  const rateNumber = byId<HTMLInputElement>('rate-number');
  const propertyToggle = byId<HTMLButtonElement>('property-toggle');
  const downPaymentField = byId<HTMLElement>('down-payment-field');
  const dpRange = byId<HTMLInputElement>('dp-range');
  const dpNumber = byId<HTMLInputElement>('dp-number');
  const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('.dsr-chip'));

  bindMoney(salary, 'monthlySalary', 'salary', store);
  bindMoney(commitments, 'existingCommitments', 'commitments', store);
  bindPair(dsrRange, dsrNumber, 'dsrPercent', 'dsr', store);
  bindPair(rateRange, rateNumber, 'annualRatePercent', 'rate', store);
  bindPair(dpRange, dpNumber, 'downPaymentPercent', 'downPayment', store);
  bindCount(years, 'years', 'years', store);
  bindCount(months, 'months', 'months', store);

  propertyToggle.addEventListener('click', () => {
    const next = !store.get().propertyMode;
    propertyToggle.setAttribute('aria-pressed', String(next));
    downPaymentField.hidden = !next;
    store.set({ propertyMode: next });
  });

  for (const chip of chips) {
    chip.addEventListener('click', () => {
      const value = clampField('dsr', Number(chip.dataset.dsr));
      store.set({ dsrPercent: value });
      syncControls(store.get());
    });
  }

  /** Push state into controls (used at init and for chip presses). */
  function syncControls(inputs: AppInputs): void {
    propertyToggle.setAttribute('aria-pressed', String(inputs.propertyMode));
    downPaymentField.hidden = !inputs.propertyMode;
    if (dpNumber !== document.activeElement) dpNumber.value = String(inputs.downPaymentPercent);
    dpRange.value = String(inputs.downPaymentPercent);
    setFill(dpRange);
    const active = document.activeElement;
    if (salary !== active) salary.value = grouping.format(inputs.monthlySalary);
    if (commitments !== active) commitments.value = grouping.format(inputs.existingCommitments);
    if (dsrNumber !== active) dsrNumber.value = String(inputs.dsrPercent);
    dsrRange.value = String(inputs.dsrPercent);
    setFill(dsrRange);
    if (rateNumber !== active) rateNumber.value = String(inputs.annualRatePercent);
    rateRange.value = String(inputs.annualRatePercent);
    setFill(rateRange);
    if (years !== active) years.value = String(inputs.years);
    if (months !== active) months.value = String(inputs.months);
  }

  store.subscribe((inputs) => {
    for (const chip of chips) {
      chip.setAttribute('aria-pressed', String(Number(chip.dataset.dsr) === inputs.dsrPercent));
    }
  });

  syncControls(store.get());

  // Guard against accidental form submission reloading the page.
  salary.form?.addEventListener('submit', (event) => event.preventDefault());
}
