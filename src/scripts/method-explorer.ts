/**
 * OSA paper explainers: deterministic, entirely client-side pedagogical examples.
 * Neither experiment displays patient data, learned network outputs, or measured
 * OSA trajectories. The 2x2 OSU example follows paper Eq. (1) then applies its
 * ideal polar projection (paper implementation uses finite Newton-Schulz steps).
 * APFE follows paper Eqs. (6)-(7) on a synthetic scalar feature map.
 */
type Mat2 = readonly [number, number, number, number];
type Spectrum = readonly [number, number];

const size = 88;
let dispose: (() => void) | undefined;

function clamp(n: number, lo = 0, hi = 1): number {
  return Math.max(lo, Math.min(hi, n));
}

function matmul(a: Mat2, b: Mat2): Mat2 {
  return [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3],
  ];
}

function matadd(a: Mat2, b: Mat2): Mat2 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
}

/** Closest rotation for a 2x2 nonsingular, positive-determinant toy state. */
function polar2(a: Mat2): Mat2 {
  const c = a[0] + a[3];
  const s = a[2] - a[1];
  const norm = Math.hypot(c, s);
  if (norm < 1e-12) return [1, 0, 0, 1];
  return [c / norm, -s / norm, s / norm, c / norm];
}

function singularValues(a: Mat2): Spectrum {
  const trace = a[0] ** 2 + a[1] ** 2 + a[2] ** 2 + a[3] ** 2;
  const det = a[0] * a[3] - a[1] * a[2];
  const disc = Math.sqrt(Math.max(0, trace * trace - 4 * det * det));
  return [
    Math.sqrt(Math.max(0, (trace + disc) / 2)),
    Math.sqrt(Math.max(0, (trace - disc) / 2)),
  ];
}

/** Gated delta recurrence of paper Eq. (1), with fixed illustrative inputs. */
function recurrenceStep(previous: Mat2, frame: number): Mat2 {
  const alpha = 0.94;
  const beta = 0.16;
  const theta = 0.4 * Math.sin(frame * 0.14) + 0.1;
  const k0 = Math.cos(theta);
  const k1 = Math.sin(theta);
  const v0 = 1;
  const v1 = 0.25 * Math.sin(frame * 0.2);
  const a: Mat2 = [
    alpha * (1 - beta * k0 * k0),
    -alpha * beta * k0 * k1,
    -alpha * beta * k1 * k0,
    alpha * (1 - beta * k1 * k1),
  ];
  const b: Mat2 = [beta * v0 * k0, beta * v0 * k1, beta * v1 * k0, beta * v1 * k1];
  return matadd(matmul(previous, a), b);
}

function statesAt(frame: number): { baseline: Mat2; projected: Mat2 } {
  let baseline: Mat2 = [1, 0, 0, 1];
  let projected: Mat2 = [1, 0, 0, 1];
  for (let t = 1; t <= frame; t++) {
    baseline = recurrenceStep(baseline, t);
    projected = polar2(recurrenceStep(projected, t));
  }
  return { baseline, projected };
}

/** Stable deterministic noise, not a scan or clinical image. */
function noiseAt(x: number, y: number): number {
  const seed = Math.sin((x + 1) * 127.1 + (y + 1) * 311.7) * 43758.5453;
  return seed - Math.floor(seed);
}

/** A synthetic LV-like geometry + speckle + depth-dependent bias. */
function featureMap(speckle: number, attenuation: number): Float32Array {
  const output = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xx = x / (size - 1);
      const yy = y / (size - 1);
      const theta = Math.atan2((yy - 0.51) * 1.1, (xx - 0.5));
      const radius = Math.hypot((xx - 0.5) / 0.38, (yy - 0.51) / 0.46);
      const edge = 0.58 + 0.045 * Math.sin(3 * theta + 0.6);
      const tissue = radius < edge ? -0.31 : radius < edge + 0.20 ? 0.17 : 0.015 * Math.sin(yy * 22);
      const acousticShadow = -0.075 * Math.exp(-(((xx - 0.77) / 0.13) ** 2)) * yy;
      const bias = -0.38 * attenuation * yy;
      const interference = speckle * 0.40 * (noiseAt(x, y) - 0.5);
      output[y * size + x] = clamp(0.58 + tissue + acousticShadow + bias + interference);
    }
  }
  return output;
}

/** KxK same-size average pooling with replicated-edge padding. */
function localMean(input: Float32Array, kernel = 11): Float32Array {
  const output = new Float32Array(input.length);
  const half = Math.floor(kernel / 2);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let sum = 0;
      for (let ky = -half; ky <= half; ky++) {
        const sy = Math.min(size - 1, Math.max(0, y + ky));
        for (let kx = -half; kx <= half; kx++) {
          const sx = Math.min(size - 1, Math.max(0, x + kx));
          sum += input[sy * size + sx];
        }
      }
      output[y * size + x] = sum / (kernel * kernel);
    }
  }
  return output;
}

/** Fixed visual scaling for residual channels; math stays unscaled. */
function drawFeature(canvas: HTMLCanvasElement, values: Float32Array, mode: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < values.length; i++) {
    const raw = values[i];
    const visual = mode === 'positive' || mode === 'negative' ? clamp(raw * 5) : clamp(raw);
    const base = 4 * i;
    if (mode === 'positive') {
      image.data[base] = Math.round(12 + 67 * visual);
      image.data[base + 1] = Math.round(24 + 208 * visual);
      image.data[base + 2] = Math.round(33 + 181 * visual);
    } else if (mode === 'negative') {
      image.data[base] = Math.round(23 + 223 * visual);
      image.data[base + 1] = Math.round(20 + 138 * visual);
      image.data[base + 2] = Math.round(31 + 91 * visual);
    } else {
      const gray = Math.round(255 * visual);
      image.data[base] = gray;
      image.data[base + 1] = gray;
      image.data[base + 2] = gray;
    }
    image.data[base + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
}

function mount(): void {
  const root = document.querySelector<HTMLElement>('[data-osa-explainer]');
  if (!root) {
    dispose?.();
    dispose = undefined;
    return;
  }
  if (root.dataset.osaMounted === 'true') return;
  const slider = root.querySelector<HTMLInputElement>('[data-osu-step]');
  const stepOutput = root.querySelector<HTMLOutputElement>('[data-osu-step-value]');
  const play = root.querySelector<HTMLButtonElement>('[data-osu-play]');
  const reset = root.querySelector<HTMLButtonElement>('[data-osu-reset]');
  const speckleSlider = root.querySelector<HTMLInputElement>('[data-apfe-speckle]');
  const attenuationSlider = root.querySelector<HTMLInputElement>('[data-apfe-attenuation]');
  const speckleOutput = root.querySelector<HTMLOutputElement>('[data-apfe-speckle-value]');
  const attenuationOutput = root.querySelector<HTMLOutputElement>('[data-apfe-attenuation-value]');
  if (!slider || !stepOutput || !play || !reset || !speckleSlider || !attenuationSlider || !speckleOutput || !attenuationOutput) return;

  dispose?.();
  root.dataset.osaMounted = 'true';
  let timer: number | undefined;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const playText = play.dataset.labelPlay || 'Play';
  const pauseText = play.dataset.labelPause || 'Pause';
  const nextText = play.dataset.labelNext || 'Next step';

  const refreshOsu = (): void => {
    const frame = clamp(Number(slider.value), 0, 30);
    stepOutput.textContent = String(frame) + ' / 30';
    const { baseline, projected } = statesAt(frame);
    const states = [
      { prefix: 'e', mat: baseline, spectrum: singularValues(baseline) },
      { prefix: 'o', mat: projected, spectrum: singularValues(projected) },
    ];
    for (const state of states) {
      for (let column = 0; column < 2; column++) {
        const id = state.prefix + String(column);
        const vx = state.mat[column];
        const vy = state.mat[2 + column];
        const x = (110 + 60 * vx).toFixed(2);
        const y = (86 - 60 * vy).toFixed(2);
        root.querySelector<SVGLineElement>('[data-osu-vector="' + id + '"]')?.setAttribute('x2', x);
        root.querySelector<SVGLineElement>('[data-osu-vector="' + id + '"]')?.setAttribute('y2', y);
        root.querySelector<SVGCircleElement>('[data-osu-dot="' + id + '"]')?.setAttribute('cx', x);
        root.querySelector<SVGCircleElement>('[data-osu-dot="' + id + '"]')?.setAttribute('cy', y);
        const sigma = state.spectrum[column];
        const bar = root.querySelector<HTMLElement>('[data-osu-bar="' + id + '"]');
        if (bar) bar.style.width = String(clamp(sigma) * 100) + '%';
        const value = root.querySelector<HTMLOutputElement>('[data-osu-value="' + id + '"]');
        if (value) value.textContent = sigma.toFixed(2);
      }
    }
  };

  const stop = (): void => {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
    play.textContent = prefersReducedMotion ? nextText : playText;
    play.setAttribute('aria-pressed', 'false');
  };

  const refreshApfe = (): void => {
    const speckle = Number(speckleSlider.value) / 100;
    const attenuation = Number(attenuationSlider.value) / 100;
    speckleOutput.textContent = speckleSlider.value + '%';
    attenuationOutput.textContent = attenuationSlider.value + '%';
    const x = featureMap(speckle, attenuation);
    const m = localMean(x);
    const positive = new Float32Array(x.length);
    const negative = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) {
      positive[i] = Math.max(x[i] - m[i], 0);
      negative[i] = Math.max(m[i] - x[i], 0);
    }
    const fields: Record<string, Float32Array> = { input: x, mean: m, positive, negative };
    for (const canvas of root.querySelectorAll<HTMLCanvasElement>('[data-apfe-canvas]')) {
      const mode = canvas.dataset.apfeCanvas ?? '';
      if (fields[mode]) drawFeature(canvas, fields[mode], mode);
    }
  };

  slider.addEventListener('input', () => { stop(); refreshOsu(); });
  reset.addEventListener('click', () => { stop(); slider.value = '0'; refreshOsu(); });
  play.addEventListener('click', () => {
    if (prefersReducedMotion) {
      slider.value = String((Number(slider.value) + 1) % 31);
      refreshOsu();
      return;
    }
    if (timer !== undefined) { stop(); return; }
    if (Number(slider.value) >= 30) slider.value = '0';
    play.textContent = pauseText;
    play.setAttribute('aria-pressed', 'true');
    timer = window.setInterval(() => {
      const next = Number(slider.value) + 1;
      slider.value = String(Math.min(30, next));
      refreshOsu();
      if (next >= 30) stop();
    }, 390);
  });
  speckleSlider.addEventListener('input', refreshApfe);
  attenuationSlider.addEventListener('input', refreshApfe);

  if (prefersReducedMotion) play.textContent = nextText;
  refreshOsu();
  refreshApfe();
  dispose = stop;
}

document.addEventListener('astro:page-load', mount);
document.addEventListener('astro:before-swap', () => {
  dispose?.();
  dispose = undefined;
});
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}