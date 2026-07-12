import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter';

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/print.css';

import { computeLoan } from './engine/loan';
import { encodeState, decodeState } from './engine/url-state';
import { initState } from './state';
import { renderGuilloche } from './ui/guilloche';
import { bindInputs } from './ui/inputs';
import { initStickyResult, renderResults } from './ui/results';
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

store.subscribe((inputs, status) => {
  renderResults(inputs, status, computeLoan(inputs));
});

// Keep the URL shareable: reflect inputs into the query string, debounced.
let urlTimer: ReturnType<typeof setTimeout> | undefined;
store.subscribe((inputs) => {
  clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    history.replaceState(null, '', `${window.location.pathname}?${encodeState(inputs)}`);
  }, 150);
});
