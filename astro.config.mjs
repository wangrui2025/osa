import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import astroIcon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';
import stripWoffFallback from './src/integrations/strip-woff-fallback.mjs';
import buildSlidesHtml from './src/integrations/build-slides-html.mjs';
import { execSync } from 'node:child_process';

// Build-time injection of the last commit date (used by Footer.astro for
// "Last updated" / "最后更新" string). Avoids hand-edited, silently-stale
// dates in the homepage content JSON. Falls back to today's date in
// non-git environments (e.g. tarball builds) so the build never breaks.
let lastUpdated;
try {
  lastUpdated = execSync('git log -1 --format=%cd --date=short', {
    cwd: process.cwd(),
    encoding: 'utf-8',
  }).trim();
} catch {
  lastUpdated = new Date().toISOString().split('T')[0];
}

export default defineConfig({
  output: 'static',
  site: 'https://wangrui2025.github.io',
  base: '/osa',
  prefetch: true,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  image: {
    remotePatterns: [
      { protocol: 'https', hostname: 'mykcs.github.io' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
    ],
  },
  integrations: [
    sitemap({
      // Emit <xhtml:link rel="alternate" hreflang="..."> in the sitemap for
      // every localized URL. Without this, Google Search Console sees the
      // sitemap as monolingual and the per-page <link rel="alternate"> tags
      // are the only hreflang signal — works for indexing but the sitemap
      // hint is the canonical SEO recommendation for multi-locale sites.
      // Default locale is 'en'; x-default points at the English URL.
      // (Round 18 P2 — was missing despite i18n routing being in place since Round 3.)
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          zh: 'zh',
        },
      },
      filter: (page) => {
        // Exclude 404 pages and the legacy /osa/ + /osa/slides/ redirector stubs.
        // Sitemap integration passes fully-qualified URLs (e.g. https://...osa/slides/),
        // so strip protocol+host and re-anchor the path match.
        const path = page.replace(/^https?:\/\/[^/]+/, '');
        return !path.includes('/404/') && !/^\/osa\/(slides\/)?$/.test(path);
      },
    }),
    astroIcon(),
    stripWoffFallback(),
    buildSlidesHtml(),
  ],
  vite: {
    plugins: [tailwindcss()],
    define: {
      __OSA_LAST_UPDATED__: JSON.stringify(lastUpdated),
    },
  },
});
