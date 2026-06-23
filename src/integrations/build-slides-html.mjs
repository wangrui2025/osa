#!/usr/bin/env node
/**
 * Astro Integration: build-slides-html
 *
 * Generates `public/slides-raw/index.html` at build:start so the iframe in
 * `/[lang]/slides/` can load the pre-rendered slide content from a stable
 * static URL without creating a real Astro route at `/slides/`.
 *
 * Why `/slides-raw/` and not `/slides/`:
 *   Originally this wrote to `public/slides/index.html`. That worked for the
 *   iframe, but `/slides/` then became a real served URL — direct visitors
 *   (and search engines) would hit the raw slide content with no Astro chrome.
 *   The fix is to move the raw asset to `/slides-raw/` and let the
 *   /slides/ route be a meta-refresh redirector (src/pages/slides.astro)
 *   to the locale-prefixed wrapper. See docs/adr/0006-slides-asset-redirect.md.
 *
 * The transformation logic is identical to before (read src/slides.src, strip
 * KaTeX CDN, pre-render LaTeX, fix font/image paths, inject KaTeX CSS).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import katex from 'katex';
import academicCdnConfig from '../config/academic-cdn.json' with { type: 'json' };

const ACADEMIC_CDN_VERSION = academicCdnConfig.version;
const ACADEMIC_CDN_BASE = `https://cdn.jsdelivr.net/gh/mykcs/academic@${ACADEMIC_CDN_VERSION}/images`;

/**
 * Render the slides source into a fully self-contained HTML string.
 * Exported for testability; the integration calls this and writes the
 * result to public/slides-raw/index.html.
 */
export function renderSlidesHtml({ slidesSrcPath, baseUrl }) {
  let html = fs.readFileSync(slidesSrcPath, 'utf-8');

  // Step 1: Remove KaTeX CDN scripts/styles first (before formula replacement)
  html = html.replace(/<link[^>]*href="[^"]*katex[^"]*"[^>]*>/gi, '');
  html = html.replace(/<script[^>]*src="[^"]*(?:katex|auto-render)[^"]*"[^>]*><\/script>/gi, '');

  // Step 2: Precisely remove ONLY the renderMathInElement block, keep updateScales
  const rmeStart = "if (typeof renderMathInElement !== 'undefined')";
  const rmeEnd = "});\n        }";
  const rmeRegex = new RegExp(rmeStart.replace(/[()]/g, '\\$&') + '[\\s\\S]*?' + rmeEnd.replace(/[()]/g, '\\$&'), 'gi');
  html = html.replace(rmeRegex, '');

  // Step 3: Pre-render formulas (source uses $$...$$ format inside katex-display spans)
  html = html.replace(
    /<span[^>]*class="[^"]*katex-display[^"]*"[^>]*>\$\$([^$]+)\$\$/g,
    (_match, latex) => {
      const rendered = katex.renderToString(latex.trim(), { displayMode: true, throwOnError: false });
      // KaTeX outputs katex-display span; strip it to avoid nesting
      return rendered.replace(/<span class="katex-display">/, '<span class="katex-rendered-inner">');
    }
  );

  // Step 4: Fix font paths - add base prefix for GitHub Pages
  html = html.replace(/href="\/fonts\//g, `href="${baseUrl}/fonts/`);

  // Step 5: Fix image paths - use CDN for academic images
  html = html.replace(/src="\/academic\/images\//g, `src="${ACADEMIC_CDN_BASE}/`);

  // Step 6: Inject KaTeX CSS (removed CDN version above, need styles for pre-rendered formulas)
  html = html.replace('</head>', `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.47/dist/katex.min.css" /></head>`);

  return html;
}

function buildSlidesHtml() {
  return {
    name: 'build-slides-html',
    hooks: {
      'astro:config:setup': ({ config, command }) => {
        // Only run for build/dev (not for `astro preview` of an existing dist).
        // For dev, we still want the file so the iframe works.
        if (command === 'preview') return;

        const cwd = fileURLToPath(config.root || path.resolve(process.cwd()));
        const slidesSrcPath = path.join(cwd, 'src/slides.src');
        // Write to /slides-raw/ (not /slides/) so the bare /slides/ URL can
        // be served by src/pages/slides.astro (a meta-refresh redirector)
        // instead of the raw slide content. See module docstring.
        const outDir = path.join(cwd, 'public/slides-raw');
        const outFile = path.join(outDir, 'index.html');

        if (!fs.existsSync(slidesSrcPath)) {
          console.warn('[build-slides-html] src/slides.src not found at', slidesSrcPath, '- skipping');
          return;
        }

        const html = renderSlidesHtml({
          slidesSrcPath,
          baseUrl: config.base || '/',
        });

        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(outFile, html, 'utf-8');
        console.log(`[build-slides-html] wrote ${path.relative(cwd, outFile)} (${html.length} bytes)`);
      },
    },
  };
}

export default buildSlidesHtml;
