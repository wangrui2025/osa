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
      // P2 SEO: emit <lastmod> so GSC sees freshness signals (cross-site
      // audit 2026-07-26: 0/6 urls had lastmod before this fix).
      // Reuse the lastUpdated var already computed at module top for
      // Footer.astro so sitemap lastmod stays in sync with the visible
      // "Last updated" string on the page.
      lastmod: (() => {
        // lastUpdated is a `YYYY-MM-DD` string (execSync git log %cd --date=short);
        // sitemap expects a Date instance. Fall back to build time in
        // tarball / non-git environments where execSync throws.
        const parsed = Date.parse(lastUpdated);
        return Number.isNaN(parsed) ? new Date() : new Date(parsed);
      })(),
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
      // Round 19 P1: @astrojs/sitemap v3.7.3 only emits en+zh xhtml:link
      // entries from the i18n config — it does NOT auto-emit x-default
      // even though every per-page <link rel="alternate"> tag in the
      // site does (see Layout.astro). Use the `serialize` hook to append
      // an x-default xhtml:link pointing at the default-locale URL for
      // every multi-locale path group. The site has 3 multi-locale paths
      // (/, /poster/, /slides/) × 2 locales = 6 URLs; each will gain a
      // third xhtml:link entry. (x-default is the canonical SEO signal
      // for "this URL group is a language cluster, pick your preferred
      // language" — Google Search Console flags sitemap entries that
      // lack it when per-page tags reference x-default.)
      serialize: (item) => {
        if (item.links && Array.isArray(item.links) && item.links.length > 1) {
          const en = item.links.find((l) => l.lang === 'en');
          if (en && !item.links.some((l) => l.lang === 'x-default')) {
            item.links.push({ url: en.url, lang: 'x-default' });
          }
        }
        return item;
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
  // Round 19 P2 (known platform limitation): GitHub Pages intercepts
  // every /.well-known/ URL at the platform level (verified 2026-07-20
  // across user site + project sites — `curl
  // https://<any>.github.io/.well-known/security.txt` returns 404
  // regardless of whether a file is on disk, even when an Astro
  // `redirects:` entry writes a meta-refresh HTML stub to dist/).
  // Therefore security.txt lives at /security.txt (200 OK) and its
  // `Canonical:` field points at that same path, which is the
  // reachable URL. The /osa/.well-known/security.txt URL stays
  // unreachable until GH Pages changes this behavior or the project
  // migrates to a different host (Cloudflare Pages / Netlify).
  // Same root cause as Round 11 mysite's .well-known/security.txt 404.
  vite: {
    plugins: [tailwindcss()],
    define: {
      __OSA_LAST_UPDATED__: JSON.stringify(lastUpdated),
    },
  },
});
