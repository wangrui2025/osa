/**
 * OSA A/B explainer: a pure client-side teaching model, not clinical footage or
 * model inference. Both variants share exactly the same renderer and mathematics.
 */
const WIDTH = 320;
const HEIGHT = 240;
let activeCleanup: (() => void) | null = null;

const bounded = (v: number, lo = 0, hi = 1): number => Math.max(lo, Math.min(hi, v));

function noise(x: number, y: number, frame: number): number {
  const raw = Math.sin((x + 17) * 87.31 + (y + 5) * 173.9 + frame * 13.37) * 48943.231;
  return raw - Math.floor(raw);
}

function drawSyntheticScene(canvas: HTMLCanvasElement, frame: number): void {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return;
  const w = WIDTH, h = HEIGHT;
  const pixels = context.createImageData(w, h);
  const phase = frame * Math.PI * 2 / 30;
  const cx = 160 + 5 * Math.sin(phase);
  const cy = 128 - 3 * Math.sin(phase + 1);
  const rx = 48 + 13 * Math.cos(phase);
  const ry = 70 + 10 * Math.cos(phase + 0.4);
  const depth = 0.08 + 0.18 * Math.sin(phase / 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const fanHalfWidth = 12 + y * 0.62;
      const insideFan = y > 17 && Math.abs(x - 160) < fanHalfWidth;
      if (!insideFan) {
        pixels.data[i] = 6; pixels.data[i+1] = 13; pixels.data[i+2] = 23; pixels.data[i+3] = 255;
        continue;
      }
      const elliptical = Math.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2);
      const border = Math.exp(-(((elliptical - 1.05) / 0.13) ** 2));
      const tissue = elliptical < 1 ? 0.17 : 0.42;
      const speckle = 0.33 * (noise(Math.floor(x / 2), Math.floor(y / 2), frame) - 0.5) +
        0.16 * (noise(x, y, frame + 7) - 0.5);
      const shade = bounded((tissue + border * .35 + speckle) * (1 - depth * y/h));
      const gray = Math.round(10 + 190 * shade);
      pixels.data[i] = gray;
      pixels.data[i+1] = Math.round(gray * 1.02);
      pixels.data[i+2] = Math.round(gray * 1.08);
      pixels.data[i+3] = 255;
    }
  }
  context.putImageData(pixels, 0, 0);
  // This contour outlines the synthetic geometry only; it is NOT an OSA prediction.
  context.beginPath();
  context.ellipse(cx, cy, rx, ry, -.10, 0, Math.PI * 2);
  context.strokeStyle = '#7ef8d8';
  context.lineWidth = 2.8;
  context.stroke();
  context.beginPath();
  context.ellipse(cx, cy, rx + 2, ry + 2, -.1, 0, Math.PI * 2);
  context.strokeStyle = '#57f1cf44';
  context.lineWidth = 8;
  context.stroke();
}

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-osa-study]');
  if (!root || root.dataset.mounted === 'true') return;
  const slider = root.querySelector<HTMLInputElement>('[data-study-time]');
  const canvas = root.querySelector<HTMLCanvasElement>('[data-study-scan]');
  const play = root.querySelector<HTMLButtonElement>('[data-study-play]');
  const reset = root.querySelector<HTMLButtonElement>('[data-study-reset]');
  const output = root.querySelector<HTMLOutputElement>('[data-frame-output]');
  const angleSlider = root.querySelector<HTMLInputElement>('[data-study-angle]');
  if (!slider || !canvas || !play || !reset || !output || !angleSlider) return;
  activeCleanup?.();
  root.dataset.mounted = 'true';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer: number | null = null;
  const drawFrame = () => {
    const f = Number(slider.value);
    drawSyntheticScene(canvas, f);
    output.textContent = String(f).padStart(2, '0') + ' / 30';
  };
  const stop = () => {
    if (timer !== null) clearInterval(timer);
    timer = null;
    play.setAttribute('aria-pressed', 'false');
    const label = play.querySelector<HTMLElement>('[data-play-label]');
    const icon = play.querySelector<HTMLElement>('[data-play-icon]');
    if (label) label.textContent = root.dataset.playText || 'Play';
    if (icon) icon.textContent = '▶';
  };
  const resume = () => {
    if (reduceMotion) {
      slider.value = String((Number(slider.value) + 1) % 31);
      drawFrame();
      return;
    }
    if (timer !== null) { stop(); return; }
    if (Number(slider.value) >= 30) slider.value = '0';
    play.setAttribute('aria-pressed','true');
    const label = play.querySelector<HTMLElement>('[data-play-label]');
    const icon = play.querySelector<HTMLElement>('[data-play-icon]');
    if (label) label.textContent = root.dataset.pauseText || 'Pause';
    if (icon) icon.textContent = 'Ⅱ';
    timer = window.setInterval(() => {
      slider.value = String((Number(slider.value) + 1) % 31);
      drawFrame();
    }, 180);
  };
  const clickSlider = () => { stop(); drawFrame(); };
  slider.addEventListener('input', clickSlider);
  play.addEventListener('click', resume);
  reset.addEventListener('click', () => { stop(); slider.value = '0'; drawFrame(); });

  const nodes = [...root.querySelectorAll<HTMLButtonElement>('[data-study-node]')];
  const codes: Record<string, string> = {
    backbone: '01 / ResNet-50', apfe: '02 / APFE',
    osu: '03 / OSU', decoder: '04 / Decoder'
  };
  const inspectorCode = root.querySelector<HTMLElement>('[data-study-current-code]');
  for (const button of nodes) {
    button.addEventListener('click', () => {
      const id = button.dataset.studyNode || '';
      nodes.forEach(node => node.setAttribute('aria-pressed', String(node.dataset.studyNode === id)));
      root.querySelectorAll<HTMLElement>('[data-study-panel]').forEach(panel => {
        panel.hidden = panel.dataset.studyPanel !== id;
      });
      if (inspectorCode) inspectorCode.textContent = codes[id] || '';
    });
  }

  const angleOutput = root.querySelector<HTMLOutputElement>('[data-angle-readout]');
  const sigmaOutput = root.querySelector<HTMLElement>('[data-sigma-readout]');
  const conditionOutput = root.querySelector<HTMLElement>('[data-condition-readout]');
  const anglePath = root.querySelector<SVGPathElement>('[data-geometry-vector]');
  const angleLabel = root.querySelector<SVGTextElement>('[data-geometry-label]');
  const angleOutcome = root.querySelector<HTMLElement>('[data-geometry-outcome]');
  const updateAngle = () => {
    const deg = Number(angleSlider.value);
    const radians = deg * Math.PI / 180;
    const cosine = Math.cos(radians);
    const sigmaMin = Math.sqrt(Math.max(0, 1 - Math.abs(cosine)));
    const sigmaMax = Math.sqrt(1 + Math.abs(cosine));
    const kappa = sigmaMin < 1e-8 ? Infinity : sigmaMax / sigmaMin;
    const x = 94 + 150 * Math.cos(radians);
    const y = 181 - 150 * Math.sin(radians);
    if (anglePath) anglePath.setAttribute('d', 'M94 181 L' + x.toFixed(2) + ' ' + y.toFixed(2));
    if (angleLabel) {
      angleLabel.setAttribute('x', String(Math.min(337,x+7)));
      angleLabel.setAttribute('y', String(Math.max(22,y-9)));
    }
    if (angleOutput) angleOutput.textContent = deg + '°';
    if (sigmaOutput) sigmaOutput.textContent = sigmaMin.toFixed(3);
    if (conditionOutput) conditionOutput.textContent = Number.isFinite(kappa) ? kappa.toFixed(2) : '∞';
    if (angleOutcome) {
      angleOutcome.textContent = deg === 90 ? (root.dataset.angleOrthogonal || '') :
        deg <= 15 ? (root.dataset.angleNear || '') : (root.dataset.angleNeutral || '');
    }
  };
  angleSlider.addEventListener('input', updateAngle);
  root.querySelectorAll<HTMLButtonElement>('[data-study-preset]').forEach(button => {
    button.addEventListener('click', () => { angleSlider.value = button.dataset.studyPreset || '90'; updateAngle(); });
  });
  if (reduceMotion) {
    const label = play.querySelector<HTMLElement>('[data-play-label]');
    if (label) label.textContent = root.dataset.nextText || 'Next';
    play.setAttribute('aria-label', root.dataset.nextText || 'Next');
  }
  drawFrame();
  updateAngle();
  activeCleanup = stop;
}
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => {
  activeCleanup?.();
  activeCleanup = null;
});
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
