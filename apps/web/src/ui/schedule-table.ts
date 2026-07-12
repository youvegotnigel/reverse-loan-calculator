import { formatLKR } from '@rlc/engine';
import { type Schedule } from '@rlc/engine';

type View = 'yearly' | 'monthly';

let current: Schedule | null = null;
let view: View = 'yearly';

function draw(tbody: HTMLTableSectionElement): void {
  tbody.replaceChildren();
  if (!current) return;

  const rows =
    view === 'yearly'
      ? current.years.map((r) => ({ label: `Year ${r.year}`, ...r }))
      : current.months.map((r) => ({ label: `Month ${r.month}`, ...r }));

  for (const row of rows) {
    const tr = document.createElement('tr');
    const cells = [
      row.label,
      formatLKR(row.principalPaid),
      formatLKR(row.interestPaid),
      formatLKR(row.closingBalance),
    ];
    for (const text of cells) {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  const details = tbody.closest('details');
  const summary = details?.querySelector('summary');
  if (summary) {
    summary.textContent =
      view === 'yearly'
        ? `Year-by-year breakdown (${current.years.length} year${current.years.length === 1 ? '' : 's'})`
        : `Month-by-month breakdown (${current.months.length} month${current.months.length === 1 ? '' : 's'})`;
  }
  details?.querySelector('.table-wrap')?.classList.toggle('is-monthly', view === 'monthly');
}

export function renderScheduleTable(tbody: HTMLTableSectionElement, schedule: Schedule): void {
  current = schedule;
  draw(tbody);
}

/** Bind the Yearly / Monthly toggle chips. Call once at startup. */
export function initScheduleToggle(tbody: HTMLTableSectionElement): void {
  const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('.view-chip'));
  for (const chip of chips) {
    chip.addEventListener('click', () => {
      view = chip.dataset.view === 'monthly' ? 'monthly' : 'yearly';
      for (const c of chips) {
        c.setAttribute('aria-pressed', String(c === chip));
      }
      draw(tbody);
    });
  }
}
