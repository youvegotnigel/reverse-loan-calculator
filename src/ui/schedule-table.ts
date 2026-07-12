import { formatLKR } from '../engine/format';
import { type YearRow } from '../engine/schedule';

export function renderScheduleTable(tbody: HTMLTableSectionElement, years: YearRow[]): void {
  tbody.replaceChildren();
  for (const row of years) {
    const tr = document.createElement('tr');
    const cells = [
      `Year ${row.year}`,
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

  const summary = tbody.closest('details')?.querySelector('summary');
  if (summary) {
    summary.textContent = `Year-by-year breakdown (${years.length} year${years.length === 1 ? '' : 's'})`;
  }
}
