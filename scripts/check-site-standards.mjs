import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import { calendarParts, formatCalendar } from '../src/utils/date-format.mjs';
import { syncStandalone, tokenStyle } from './sync-standalone-styles.mjs';
export const root = fileURLToPath(new URL('../', import.meta.url));
const canonicalNames = new Set([...fs.readFileSync(path.join(root,'src/styles/tokens.css'),'utf8').matchAll(/(--osa-[a-z-]+):/g)].map(match => match[1]));
export function filesBelow(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? filesBelow(path.join(dir, entry.name)) : [path.join(dir, entry.name)]).sort();
}
export function inspectCss(css, label = 'CSS') {
  const errors = [];
  const ast = postcss.parse(css, { from: label });
  const localNames = new Set();
  ast.walkDecls(decl => { if (decl.prop.startsWith('--osa-')) localNames.add(decl.prop); });
  ast.walkDecls(decl => {
    for (const ref of decl.value.matchAll(/var\((--osa-[a-z-]+)/g)) if (!canonicalNames.has(ref[1]) && !localNames.has(ref[1])) errors.push(`${label}: undefined shared token ${ref[1]}`);
    const { prop, value } = decl;
    if (prop.startsWith('--')) return;
    if (/^(font|font-size|font-family|font-weight|line-height|letter-spacing)$/.test(prop)) {
      const zeroWrapper = prop === 'line-height' && value === '0' && decl.parent.selector === '.slide-wrapper';
      const inherited = value === 'inherit' || (prop === 'letter-spacing' && /^(normal|0)$/.test(value));
      if (!zeroWrapper && !inherited && !/var\(--(?:osa-|font-)/.test(value)) errors.push(`${label}: ${decl.parent.selector} ${prop}:${value} bypasses a role`);
    }
    if (/^(padding|margin|gap|row-gap|column-gap|scroll-margin)(?:-(?:top|right|bottom|left|inline|block))?$/.test(prop) && /[\d.](?:px|rem|em|in|cm)\b/.test(value)) errors.push(`${label}: ${decl.parent.selector} ${prop}:${value} bypasses spacing`);
    if (prop === 'max-width' && /[\d.](?:px|rem|em)\b/.test(value)) errors.push(`${label}: ${decl.parent.selector} max-width:${value} bypasses width`);
  });
  return errors;
}
export function inspectSource(source, label) {
  const errors = [];
  if (label.endsWith('tokens.css')) return errors;
  source = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
  const styles = label.endsWith('.css') ? [source] : [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]);
  for (const css of styles) errors.push(...inspectCss(css, label));
  for (const match of source.matchAll(/style=["']([^"']+)["']/g)) errors.push(...inspectCss(`inline{${match[1]}}`, label));
  if (/\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\b|\b(?:text|leading|tracking|font)-\[/.test(source)) errors.push(`${label}: non-semantic typography utility`);
  if (/\bfont-size=["']\d/.test(source)) errors.push(`${label}: literal SVG text size`);
  return errors;
}
const strip = html => html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|pre|code|math)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&#(?:x([\da-f]+)|(\d+));/gi, (_, hex, dec) => String.fromCodePoint(parseInt(hex || dec, hex ? 16 : 10))).replace(/&nbsp;/g,' ');
export function inspectHtml(html, css, label = 'HTML') {
  const errors = [];
  if (!/data-site-standards=["']osa-v1["']/.test(html)) errors.push(`${label}: missing standards layout`);
  if (!css.includes('--osa-contract-version:') || !/font-(?:family|size):\s*var\(--osa-/.test(css) || !/body[^{}]*\{[^{}]*font-(?:family|size):\s*var\(--osa-/.test(css)) errors.push(`${label}: detached stylesheet or body consumer`);
  for (const match of html.matchAll(/<time\b([^>]*)>([\s\S]*?)<\/time>/g)) {
    const attr = name => new RegExp(`${name}=["']([^"']+)["']`).exec(match[1])?.[1];
    const value = attr('datetime'), lang = attr('data-calendar-lang'), precision = attr('data-calendar');
    try {
      if (!lang || !precision || calendarParts(value).precision !== precision || strip(match[2]).trim() !== formatCalendar(value, lang)) errors.push(`${label}: nonstandard time ${value}`);
    } catch { errors.push(`${label}: invalid time ${value}`); }
  }
  const visible = strip((/<body[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1] || html).replace(/<time\b[^>]*>[\s\S]*?<\/time>/g, ''));
  if (/\b\d{4}[-/.]\d{1,2}(?:[-/.]\d{1,2})?\b|\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b|\d{4}\s*年\s*\d{1,2}\s*月(?:\s*\d{1,2}\s*日)?|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(?:\d{1,2},?\s+)?\d{4}\b/i.test(visible)) errors.push(`${label}: calendar text must use DateText`);
  return errors;
}
export function routeInventory(dist = path.join(root, 'dist')) {
  return filesBelow(dist).filter(file => file.endsWith('.html')).map(file => {
    const relative = path.relative(dist, file).replaceAll(path.sep, '/');
    const html = fs.readFileSync(file, 'utf8');
    const inline = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]);
    const sheets = [...html.matchAll(/<link\b[^>]*>/g)].filter(m => /rel=["']stylesheet["']/.test(m[0])).map(m => /href=["']([^"']+)["']/.exec(m[0])?.[1]).filter(Boolean);
    const css = [...inline, ...sheets.filter(href => href.startsWith('/osa/')).map(href => fs.readFileSync(path.join(dist, href.slice('/osa/'.length)), 'utf8'))].join('\n');
    const refresh = /http-equiv=["']refresh["'][^>]*content=["']0;url=([^"']+)/.exec(html)?.[1];
    return { file: relative, url: '/osa/' + relative.replace(/index\.html$/, ''), surface: /data-standard-surface=["']([^"']+)/.exec(html)?.[1], redirect: refresh || null, stylesheetCount: sheets.length, errors: inspectHtml(html, css, relative) };
  });
}
export function checkStandards({ output = true } = {}) {
  syncStandalone({ check: true });
  const sourceFiles = [...filesBelow(path.join(root, 'src')).filter(file => /\.(?:css|astro|src)$/.test(file)), path.join(root, 'public/404.html')];
  const errors = sourceFiles.flatMap(file => inspectSource(fs.readFileSync(file, 'utf8'), path.relative(root, file)));
  let inventory = [];
  if (output) {
    inventory = routeInventory();
    for (const item of inventory) errors.push(...item.errors);
    for (const target of ['404.html', 'slides-raw/index.html']) if (!fs.readFileSync(path.join(root, 'dist', target), 'utf8').includes(tokenStyle())) errors.push(`${target}: canonical embedded token copy differs`);
    const required = ['index.html','slides/index.html','404.html','slides-raw/index.html', ...['en','zh'].flatMap(lang => ['','404/','poster/','slides/','explore/','explore/network-first/','explore/video-first/'].map(route => `${lang}/${route}index.html`))];
    for (const file of required) if (!inventory.some(item => item.file === file)) errors.push(`Required route missing: ${file}`);
    fs.mkdirSync(path.join(root, 'test-results/standards'), { recursive: true });
    fs.writeFileSync(path.join(root, 'test-results/standards/route-inventory.json'), JSON.stringify(inventory, null, 2) + '\n');
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return { sourceFiles: sourceFiles.length, routes: inventory.length };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) console.log('Site standards:', checkStandards({ output: !process.argv.includes('--source-only') }));
