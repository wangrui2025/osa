import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import astroIcon from 'astro-icon';

export default defineConfig({
  site: 'https://wangrui2025.github.io',
  base: '/osa',
  prefetch: true,
  redirects: {
    '/slides.html': '/slides',
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true,
    },
  },
  integrations: [
    sitemap(),
    astroIcon(),
  ],
});
