const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Draws a banknote-style guilloche rosette: layered rotated ellipses with
 * fine, low-opacity strokes. Deterministic — no randomness.
 */
export function renderGuilloche(target: SVGElement, petals = 24): void {
  const cx = 200;
  const cy = 200;
  for (let k = 0; k < petals; k++) {
    const ellipse = document.createElementNS(SVG_NS, 'ellipse');
    ellipse.setAttribute('cx', String(cx));
    ellipse.setAttribute('cy', String(cy));
    ellipse.setAttribute('rx', '160');
    ellipse.setAttribute('ry', '62');
    ellipse.setAttribute('fill', 'none');
    ellipse.setAttribute('stroke', '#e5b75c');
    ellipse.setAttribute('stroke-opacity', '0.07');
    ellipse.setAttribute('stroke-width', '1');
    ellipse.setAttribute('transform', `rotate(${(180 / petals) * k} ${cx} ${cy})`);
    target.appendChild(ellipse);
  }
  const ring = document.createElementNS(SVG_NS, 'circle');
  ring.setAttribute('cx', String(cx));
  ring.setAttribute('cy', String(cy));
  ring.setAttribute('r', '110');
  ring.setAttribute('fill', 'none');
  ring.setAttribute('stroke', '#e5b75c');
  ring.setAttribute('stroke-opacity', '0.1');
  ring.setAttribute('stroke-width', '1');
  target.appendChild(ring);
}
