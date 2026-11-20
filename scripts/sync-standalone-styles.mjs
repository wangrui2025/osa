/** Shared tokens are embedded, not fetched: GitHub Pages' fallback works at unknown paths. */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
export const tokensPath = new URL('src/styles/tokens.css', root);
export function tokenStyle() {
  return `<style data-osa-tokens>\n${fs.readFileSync(tokensPath, 'utf8')}</style>`;
}
export function syncStandalone({ check = false } = {}) {
  const file = new URL('public/404.html', root);
  const source = fs.readFileSync(file, 'utf8');
  const marker = /<!-- OSA_TOKENS:START -->[\s\S]*?<!-- OSA_TOKENS:END -->/;
  if (!marker.test(source)) throw new Error('Static 404 token boundaries are missing');
  const next = source.replace(marker, `<!-- OSA_TOKENS:START -->\n${tokenStyle()}\n<!-- OSA_TOKENS:END -->`);
  if (check && source !== next) throw new Error('Static 404 tokens drifted: npm run styles:sync');
  if (!check && source !== next) fs.writeFileSync(file, next);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) syncStandalone({ check: process.argv.includes('--check') });
