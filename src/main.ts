import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter';

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/print.css';

import { computeLoan } from './engine/loan';
import { buildSchedule } from './engine/schedule';
import { encodeState, decodeState } from './engine/url-state';
import { initState } from './state';
import { renderChart } from './ui/chart';
import { renderGuilloche } from './ui/guilloche';
import { bindInputs } from './ui/inputs';
import { initStickyResult, renderResults } from './ui/results';
import { renderScheduleTable } from './ui/schedule-table';
import { initShare } from './ui/share';
import { initTheme } from './ui/theme';

const guilloche = document.querySelector<SVGElement>('#guilloche');
if (guilloche) {
  renderGuilloche(guilloche);
}

const microprint = document.querySelector<HTMLElement>('.microprint');
if (microprint) {
  microprint.textContent = 'MAXIMUM·LOAN·ESTIMATE·REDUCING·BALANCE·'.repeat(8);
}

const store = initState(decodeState(window.location.search));

bindInputs(store);

const themeToggle = document.querySelector<HTMLButtonElement>('#theme-toggle');
if (themeToggle) {
  initTheme(themeToggle);
}

initStickyResult();
initShare(store);

const chartWrap = document.querySelector<HTMLElement>('#chart-wrap');
const chartSvg = document.querySelector<SVGSVGElement>('#balance-chart');
const scheduleDetails = document.querySelector<HTMLElement>('#schedule');
const scheduleBody = document.querySelector<HTMLTableSectionElement>('#schedule-body');

store.subscribe((inputs, status) => {
  const result = computeLoan(inputs);
  renderResults(inputs, status, result);

  const showDetail = status === 'ok' && result.maxLoan > 0;
  if (chartWrap) chartWrap.hidden = !showDetail;
  if (scheduleDetails) scheduleDetails.hidden = !showDetail;
  if (!showDetail || !chartSvg || !scheduleBody) return;

  const schedule = buildSchedule(
    result.maxLoan,
    result.monthlyInstallment,
    inputs.annualRatePercent / 100 / 12,
    result.totalPayments,
  );
  renderChart(chartSvg, schedule.monthlyBalances);
  renderScheduleTable(scheduleBody, schedule.years);
});

// Keep the URL shareable: reflect inputs into the query string, debounced.
let urlTimer: ReturnType<typeof setTimeout> | undefined;
store.subscribe((inputs) => {
  clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    history.replaceState(null, '', `${window.location.pathname}?${encodeState(inputs)}`);
  }, 150);
});
