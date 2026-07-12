import { formatLKR } from '../engine/format';

const SVG_NS = 'http://www.w3.org/2000/svg';

const WIDTH = 640;
const HEIGHT = 240;
const PAD = { top: 12, right: 12, bottom: 28, left: 52 };

function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function shortMoney(value: number): string {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(Math.round(value));
}

/**
 * Single-series area chart of the remaining balance, month by month.
 * Recessive grid, muted axis text, teal line with a translucent fill,
 * and a pointer crosshair tooltip.
 */
export function renderChart(svg: SVGSVGElement, balances: number[]): void {
  svg.replaceChildren();
  const months = balances.length - 1;
  const peak = balances[0] ?? 0;
  if (months < 1 || peak <= 0) return;

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (month: number) => PAD.left + (month / months) * plotW;
  const y = (value: number) => PAD.top + (1 - value / peak) * plotH;

  svg.setAttribute(
    'aria-label',
    `Remaining balance falls from ${formatLKR(peak)} to zero over ${Math.ceil(months / 12)} year${months > 12 ? 's' : ''}.`,
  );

  // Horizontal gridlines + y labels at 0, 1/4, 1/2, 3/4, 1 of the peak.
  for (let g = 0; g <= 4; g++) {
    const value = (peak * g) / 4;
    const gy = y(value);
    svg.appendChild(
      el('line', {
        x1: String(PAD.left),
        x2: String(WIDTH - PAD.right),
        y1: String(gy),
        y2: String(gy),
        stroke: 'var(--line-200)',
        'stroke-width': g === 0 ? '1.5' : '1',
        'stroke-dasharray': g === 0 ? 'none' : '2 4',
      }),
    );
    const label = el('text', {
      x: String(PAD.left - 8),
      y: String(gy + 3),
      'text-anchor': 'end',
      'font-size': '10',
      fill: 'var(--ink-500)',
    });
    label.textContent = shortMoney(value);
    svg.appendChild(label);
  }

  // X labels: at most ~7 year ticks.
  const totalYears = months / 12;
  const step = Math.max(1, Math.ceil(totalYears / 7));
  for (let yr = 0; yr <= Math.floor(totalYears); yr += step) {
    const tx = x(yr * 12);
    const label = el('text', {
      x: String(tx),
      y: String(HEIGHT - 8),
      'text-anchor': 'middle',
      'font-size': '10',
      fill: 'var(--ink-500)',
    });
    label.textContent = yr === 0 ? 'now' : `${yr}y`;
    svg.appendChild(label);
  }

  // Area + line. Plot every month; SVG handles hundreds of points fine.
  const points = balances.map((b, m) => `${x(m).toFixed(2)},${y(b).toFixed(2)}`);
  const baseline = `${x(months).toFixed(2)},${y(0).toFixed(2)} ${x(0).toFixed(2)},${y(0).toFixed(2)}`;
  svg.appendChild(
    el('polygon', {
      points: `${points.join(' ')} ${baseline}`,
      fill: 'var(--ceylon-700)',
      'fill-opacity': '0.12',
      stroke: 'none',
    }),
  );
  svg.appendChild(
    el('polyline', {
      points: points.join(' '),
      fill: 'none',
      stroke: 'var(--ceylon-700)',
      'stroke-width': '2',
      'stroke-linejoin': 'round',
    }),
  );

  // Hover layer: crosshair dot + tooltip.
  const dot = el('circle', {
    r: '4.5',
    fill: 'var(--ceylon-700)',
    stroke: 'var(--surface-0)',
    'stroke-width': '2',
    opacity: '0',
    'pointer-events': 'none',
  });
  svg.appendChild(dot);

  const wrap = svg.closest<HTMLElement>('.chart-wrap');
  let tooltip = wrap?.querySelector<HTMLElement>('.chart-tooltip') ?? null;
  if (wrap && !tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    tooltip.hidden = true;
    wrap.appendChild(tooltip);
  }

  svg.onpointermove = (event) => {
    const rect = svg.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const month = Math.round(((px - PAD.left) / plotW) * months);
    const clamped = Math.min(months, Math.max(0, month));
    const balance = balances[clamped] ?? 0;
    dot.setAttribute('cx', x(clamped).toFixed(2));
    dot.setAttribute('cy', y(balance).toFixed(2));
    dot.setAttribute('opacity', '1');
    if (tooltip && wrap) {
      tooltip.hidden = false;
      tooltip.textContent =
        clamped === 0
          ? `Start · ${formatLKR(balance)}`
          : `Month ${clamped} · ${formatLKR(balance)}`;
      const wrapRect = wrap.getBoundingClientRect();
      const cxPx = (x(clamped) / WIDTH) * rect.width + rect.left - wrapRect.left;
      const cyPx = (y(balance) / HEIGHT) * rect.height + rect.top - wrapRect.top;
      tooltip.style.left = `${cxPx}px`;
      tooltip.style.top = `${cyPx}px`;
    }
  };
  svg.onpointerleave = () => {
    dot.setAttribute('opacity', '0');
    if (tooltip) tooltip.hidden = true;
  };
}
