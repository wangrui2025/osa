#!/usr/bin/env node
/**
 * Astro Integration: build-slides-html
 *
 * Generates `public/slides/index.html` at build:start so the iframe in
 * `/[lang]/slides/` can keep using `${BASE_URL}/slides` as a raw asset
 * URL, without creating a real Astro route at `/slides/` (which would
 * conflict with `/[lang]/` for the prefix).
 *
 * Why not an Astro route?
 *   Originally `src/pages/slides.astro` returned a `Response` with
 *   pre-rendered HTML. Astro's router still emits a `/slides/` route,
 *   which collides with the i18n catch-all and produces a build
 *   warning. Generating a static HTML file in `public/slides/` makes
 *   it a pure asset with no route entry.
 *
 * The transformation logic is identical to the old `src/pages/slides.astro`
 * module (read src/slides.src, strip KaTeX CDN, pre-render LaTeX, fix
 * font/image paths, inject KaTeX CSS).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import katex from 'katex';

const ACADEMIC_CDN_VERSION = 'v1.1.0';
const ACADEMIC_CDN_BASE = `https://cdn.jsdelivr.net/gh/mykcs/academic@${ACADEMIC_CDN_VERSION}/images`;

/**
 * Render the slides source into a fully self-contained HTML string.
 * Exported for testability; the integration calls this and writes the
 * result to public/slides/index.html.
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

  // Step 7: Inject iframe-detection script + robots noindex — prevent direct access & indexing
  // The raw slide content lives at /osa/slides/ and is loaded inside an iframe
  // by the wrapper pages at /osa/en/slides/ and /osa/zh/slides/. If a user
  // navigates directly to /osa/slides/, redirect them to the wrapper.
  const noindexAndRedirect = `<meta name="robots" content="noindex, nofollow">
  <script>
    if (window.self === window.top) {
      try {
        var ref = document.referrer || '';
        if (ref.indexOf('/zh/') !== -1) {
          window.location.replace('${baseUrl}/zh/slides/');
        } else {
          window.location.replace('${baseUrl}/en/slides/');
        }
      } catch(e) {
        window.location.replace('${baseUrl}/en/slides/');
      }
    }
  </script>`;
  html = html.replace('</head>', `${noindexAndRedirect}</head>`);

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
        const outDir = path.join(cwd, 'public/slides');
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
