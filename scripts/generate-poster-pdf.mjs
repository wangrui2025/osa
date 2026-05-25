import { chromium } from 'playwright';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, '../dist');
const url = `file://${join(dist, 'en/poster/index.html')}`;

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(url, { waitUntil: 'networkidle' });
await page.pdf({
  path: join(dist, 'osa-poster.pdf'),
  width: '84in',
  height: '42in',
  printBackground: true,
});

await browser.close();
console.log('✓ Poster PDF generated: dist/osa-poster.pdf');
