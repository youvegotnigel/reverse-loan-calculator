import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter';

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/print.css';

import { renderGuilloche } from './ui/guilloche';

const guilloche = document.querySelector<SVGElement>('#guilloche');
if (guilloche) {
  renderGuilloche(guilloche);
}

const microprint = document.querySelector<HTMLElement>('.microprint');
if (microprint) {
  microprint.textContent = 'MAXIMUM·LOAN·ESTIMATE·REDUCING·BALANCE·'.repeat(8);
}
