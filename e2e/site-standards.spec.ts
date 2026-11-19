import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { routeInventory } from '../scripts/check-site-standards.mjs';

test.describe.configure({ retries: 0 }); // Deterministic standards failures should not consume repeated full-site runs.
const routes = routeInventory();
const tokenNames = [...fs.readFileSync('src/styles/tokens.css', 'utf8').matchAll(/(--osa-[a-z-]+):/g)].map(match => match[1]);
const familyFor = (route: any) => route.redirect ? 'redirect' : route.file === 'slides-raw/index.html' ? 'slides' : route.file.endsWith('/poster/index.html') ? 'poster' : route.file.endsWith('/slides/index.html') ? 'slide-wrapper' : route.file.includes('/explore/') ? 'study' : route.surface === 'fallback' ? 'fallback' : 'paper';

async function settle(page: any) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function readText(page: any) {
  return page.evaluate((names: string[]) => {
    const root = document.documentElement;
    const declared = getComputedStyle(root);
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
    document.body.append(probe);
    const sizes: number[] = [], families: string[] = [], lines: number[] = [], weights: string[] = [];
    for (const name of names) {
      if (!declared.getPropertyValue(name)) continue;
      if (name.includes('-text-') && !/^-?[\d.]+em$/.test(declared.getPropertyValue(name).trim())) {
        probe.style.fontSize = `var(${name})`;
        sizes.push(parseFloat(getComputedStyle(probe).fontSize));
      }
      if (name.startsWith('--osa-font-')) {
        probe.style.fontFamily = `var(${name})`;
        families.push(getComputedStyle(probe).fontFamily);
      }
      if (name.includes('-leading-')) {
        probe.style.fontSize = '100px';
        probe.style.lineHeight = `var(${name})`;
        lines.push(parseFloat(getComputedStyle(probe).lineHeight) / 100);
      }
      if (name.includes('-weight-')) weights.push(declared.getPropertyValue(name).trim());
    }
    probe.remove();
    const errors: any[] = [], styles = new Map(), scrollRegions: any[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (!node.textContent?.trim()) continue;
      const element = node.parentElement;
      if (!element || element.closest('script, style, noscript, .katex, [aria-hidden="true"]')) continue;
      const closedDetails = element.closest('details:not([open])');
      if (closedDetails && !element.closest('summary')) continue; // Expanded states below are checked separately.
      const range = document.createRange(); range.selectNodeContents(node);
      const rects = [...range.getClientRects()].filter(rect => rect.height && rect.width);
      if (!rects.length) continue;
      const style = getComputedStyle(element);
      if (style.visibility !== 'visible') continue;
      const size = parseFloat(style.fontSize), leading = parseFloat(style.lineHeight) / size;
      const sample = { tag: element.tagName, text: node.textContent.trim().slice(0, 90), font: style.fontFamily, size, weight: style.fontWeight, leading };
      styles.set(JSON.stringify([style.fontFamily,size,style.fontWeight,leading]), sample);
      const parentSize = element.parentElement ? parseFloat(getComputedStyle(element.parentElement).fontSize) : size;
      const relative = element.matches('sup,sub,.title-sub') ? parentSize * .75 : element.matches('code') ? parentSize * .9 : NaN;
      if (!families.includes(style.fontFamily)) errors.push({ kind: 'family', ...sample });
      if (!sizes.some(value => Math.abs(value - size) < .08) && (!Number.isFinite(relative) || Math.abs(relative - size) > .08)) errors.push({ kind: 'size', ...sample });
      if (!weights.includes(style.fontWeight)) errors.push({ kind: 'weight', ...sample });
      if (!lines.some(value => Math.abs(value - leading) < .015)) errors.push({ kind: 'leading', ...sample });
      for (let ancestor: Element | null = element; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
        const box = ancestor.getBoundingClientRect(), containerStyle = getComputedStyle(ancestor);
        if (!box.width || !box.height) continue;
        if (['auto','scroll'].includes(containerStyle.overflowX) && ancestor.scrollWidth > ancestor.clientWidth + 2) {
          scrollRegions.push({ tag: ancestor.tagName, class: ancestor.className, horizontal: ancestor.scrollWidth - ancestor.clientWidth });
          break; // Deliberate, reachable code/formula scrolling is not clipped text.
        }
        const clipX = ['hidden','clip'].includes(containerStyle.overflowX);
        const clipY = ['hidden','clip'].includes(containerStyle.overflowY);
        if (rects.some(rect => (clipX && (rect.left < box.left - 2 || rect.right > box.right + 2)) || (clipY && (rect.top < box.top - 2 || rect.bottom > box.bottom + 2)))) {
          errors.push({ kind: 'clipped', ancestor: ancestor.className, ...sample }); break;
        }
      }
    }
    return { contract: declared.getPropertyValue('--osa-contract-version').trim(), textStyles: [...styles.values()], errors, scrollRegions, viewportOverflow: root.scrollWidth - innerWidth };
  }, tokenNames);
}
function assertText(result: any, allowCanvasOverflow = false) {
  expect(result.contract).toBe('1');
  expect(result.textStyles.length).toBeGreaterThan(0);
  expect(result.errors).toEqual([]);
  if (!allowCanvasOverflow) expect(result.viewportOverflow).toBeLessThanOrEqual(2);
}
async function perturb(page: any, selector: string, token: string, value: string, property: string) {
  const result = await page.evaluate(async ({selector,token,value,property}: any) => {
    const root = document.documentElement, consumer = document.querySelector(selector);
    if (!consumer) throw new Error(`Missing consumer ${selector}`);
    const render = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const before = getComputedStyle(consumer)[property as any];
    const beforeWidth = consumer.getBoundingClientRect().width;
    const old = root.style.getPropertyValue(token);
    root.style.setProperty(token, value); await render();
    const after = getComputedStyle(consumer)[property as any];
    const actualToken = getComputedStyle(consumer).getPropertyValue(token);
    const afterWidth = consumer.getBoundingClientRect().width;
    if (old) root.style.setProperty(token, old); else root.style.removeProperty(token);
    await render();
    const restored = getComputedStyle(consumer)[property as any];
    const restoredWidth = consumer.getBoundingClientRect().width;
    return { selector, token, property, before, after, restored, actualToken, beforeWidth, afterWidth, restoredWidth };
  }, {selector,token,value,property});
  expect(result.after, JSON.stringify(result)).not.toBe(result.before);
  expect(result.restored, JSON.stringify(result)).toBe(result.before);
  if (['width','maxWidth'].includes(property)) {
    expect(Math.abs(result.afterWidth-result.beforeWidth),JSON.stringify(result)).toBeGreaterThan(.5);
    expect(result.restoredWidth,JSON.stringify(result)).toBeCloseTo(result.beforeWidth,1);
  }
  return result;
}
async function checkDates(page: any) {
  const dates = await page.locator('time').evaluateAll((elements: Element[]) => elements.map(element => ({
    value: element.getAttribute('datetime'), lang: element.getAttribute('data-calendar-lang'), precision: element.getAttribute('data-calendar'), text: element.textContent,
  })));
  for (const date of dates) {
    const [year,month,day] = date.value.split('-');
    expect(date.precision).toBe(day ? 'day' : month ? 'month' : 'year');
    expect(date.text).toBe(date.lang === 'zh' ? `${year}年${month ? Number(month)+'月' : ''}${day ? Number(day)+'日' : ''}` : date.value);
  }
  return dates;
}

for (const route of routes) {
  const family = familyFor(route);
  for (const width of [1280, 440]) {
    const themes = ['redirect','poster','slides','slide-wrapper'].includes(family) ? ['light'] : ['light','dark'];
    for (const theme of themes) test(`${route.url} ${width}px ${theme}: real shared roles, dates, and overflow`, async ({ page }, info) => {
      test.setTimeout(60000);
      await page.setViewportSize({width,height:956});
      await page.emulateMedia({colorScheme:theme as 'light'|'dark',reducedMotion:'reduce'});
      await page.addInitScript(value => localStorage.setItem('theme', value), theme);
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      if (route.redirect) {
        await page.goto(route.url);
        await page.waitForURL(url => url.pathname === route.redirect);
        // Only the subsequent fallback fixture removes refresh. Original navigation was exercised above.
        await page.route('**'+route.url, intercepted => intercepted.fulfill({contentType:'text/html',body:fs.readFileSync(path.join('dist',route.file),'utf8').replace(/<meta\b[^>]*http-equiv="refresh"[^>]*>/i,'')}));
      }
      const response = await page.goto(route.url);
      expect(response?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await settle(page);
      const measurement = await readText(page);
      assertText(measurement, family === 'poster' || family === 'slides');
      const dates = await checkDates(page), probes = [], states = [];
      if (family === 'poster') {
        const wrapper = await page.locator('.osa-poster-wrapper').boundingBox();
        expect(wrapper!.x).toBeGreaterThanOrEqual(0);
        expect(wrapper!.x + wrapper!.width).toBeLessThanOrEqual(width + 2);
        probes.push(await perturb(page,'.osa-poster-section-body','--osa-poster-text-body','47pt','fontSize'));
        probes.push(await perturb(page,'.osa-poster-column-inner','--osa-poster-space-unit','.011in','gap'));
        probes.push(await perturb(page,'.osa-poster-wrapper','--osa-poster-width','83in','width'));
        probes.push(await perturb(page,'.osa-poster-section-body','--osa-font-body','monospace','fontFamily'));
      } else if (family === 'slides') {
        probes.push(await perturb(page,'.method-title-group h1','--osa-slide-text-heading','55px','fontSize'));
        probes.push(await perturb(page,'.slide-track','--osa-slide-space-unit','1.1px','gap'));
        probes.push(await perturb(page,'.slide','--osa-slide-width','1910px','width'));
        probes.push(await perturb(page,'.slide','--osa-font-body','monospace','fontFamily'));
      } else if (family === 'slide-wrapper') {
        probes.push(await perturb(page,'.controls','--osa-explainer-text-meta','13px','fontSize'));
        probes.push(await perturb(page,'.controls','--osa-space-unit','.3rem','gap'));
        probes.push(await perturb(page,'.controls','--osa-font-ui','monospace','fontFamily'));
        const frame = page.locator('#slides-iframe').contentFrame();
        await expect(frame.locator('.slide')).toHaveCount(12);
        const child = page.frames().find(frame => frame.url().includes('/slides-raw'))!;
        assertText(await readText(child), true);
        await page.locator('#zoom-in').click(); await expect(page.locator('#zoom-level')).toHaveText('20%');
        await page.locator('#zoom-fit').click();
      } else if (family === 'study') {
        const comparison = !!await page.locator('.comparison-shell').count();
        probes.push(await perturb(page,'.osa-study','--osa-study-text-body','17px','fontSize'));
        probes.push(await perturb(page,'.osa-study','--osa-font-ui','monospace','fontFamily'));
        probes.push(await perturb(page,comparison ? '.comparison-shell' : '.study-main','--osa-space-unit','.3rem','paddingLeft'));
        probes.push(await perturb(page,comparison ? '.comparison-shell' : '.study-main', comparison ? '--osa-width-comparison' : '--osa-width-study','16rem','maxWidth'));
        probes.push(await perturb(page,comparison ? '.comparison-hero h1' : '.study-intro h1','--osa-leading-display','1.2','lineHeight'));
        if (!comparison) {
          for (const node of ['apfe','osu']) {
            await page.locator(`[data-study-node="${node}"]`).click();
            const state = await readText(page); assertText(state); states.push({name:'node-'+node,measurement:state});
          }
          for (const summary of await page.locator('details > summary').all()) await summary.click();
          const expanded = await readText(page); assertText(expanded); states.push({name:'details-expanded',measurement:expanded});
          await page.screenshot({path:info.outputPath('details-expanded.png'),fullPage:true});
        }
      } else {
        probes.push(await perturb(page,'body','--osa-font-body','monospace','fontFamily'));
        probes.push(await perturb(page,'body','--osa-text-body','18px','fontSize'));
        probes.push(await perturb(page,'body','--osa-leading-body','1.7','lineHeight'));
        if (family === 'fallback') {
          probes.push(await perturb(page,'body','--osa-space-unit','.3rem','paddingLeft'));
          probes.push(await perturb(page,'p','--osa-width-caption','4em','maxWidth'));
        } else {
          const content = page.locator('main .max-w-page, main.max-w-page').first();
          await content.evaluate(element => element.setAttribute('data-consumer-probe','page-width'));
          probes.push(await perturb(page,'[data-consumer-probe]','--osa-width-page','16rem','maxWidth'));
          probes.push(await perturb(page,'[data-consumer-probe]','--osa-space-unit','.3rem','paddingLeft'));
          await content.evaluate(element => element.removeAttribute('data-consumer-probe'));
        }
      }
      expect(errors).toEqual([]);
      await page.screenshot({path:info.outputPath('page.png'),fullPage:family !== 'poster'});
      await info.attach('computed-evidence',{contentType:'application/json',body:Buffer.from(JSON.stringify({route,width,theme,family,mode:route.redirect?'fallback after original redirect':'unmodified route',measurement,dates,probes,states},null,2))});
    });
  }
}

test('the browser guard rejects an unowned article even when its surrounding shell is compliant', async ({page}) => {
  await page.goto('/osa/en/');
  assertText(await readText(page));
  await page.locator('main p').first().evaluate(element => (element as HTMLElement).style.fontFamily = 'cursive');
  const bad = await readText(page);
  expect(bad.errors.some((error: any) => error.kind === 'family')).toBe(true);
  await page.locator('main p').first().evaluate(element => { (element as HTMLElement).style.fontFamily = ''; (element as HTMLElement).style.fontSize = '39.123px'; });
  expect((await readText(page)).errors.some((error: any) => error.kind === 'size')).toBe(true);
});

for (const lang of ['en','zh']) test(`${lang} poster preserves all four columns and its physical print surface`, async ({page,browserName}, info) => {
  test.setTimeout(90000);
  await page.setViewportSize({width:1440,height:956});
  await page.goto(`/osa/${lang}/poster/`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.osa-poster-wrapper img').evaluateAll(images => Promise.all(images.map(image => (image as HTMLImageElement).decode().catch(() => {}))));
  const imageStatus = await page.locator('.osa-poster-wrapper img').evaluateAll(images => images.map(image => ({src:(image as HTMLImageElement).currentSrc,loaded:(image as HTMLImageElement).naturalWidth > 0})));
  expect(imageStatus.filter(image => !image.loaded)).toEqual([]);
  await page.emulateMedia({media:'print'});
  const layout = await page.evaluate(() => {
    const wrapper = document.querySelector('.osa-poster-wrapper')!;
    const style = getComputedStyle(wrapper);
    return {width:parseFloat(style.width),height:parseFloat(style.height),transform:style.transform,
      columns:[...document.querySelectorAll('.osa-poster-column')].map(column => ({scroll:column.scrollHeight,client:column.clientHeight,width:column.getBoundingClientRect().width})),
      footerDisplay:getComputedStyle(document.querySelector('.osa-poster-footer')!).display,
      controlsDisplay:getComputedStyle(document.querySelector('.osa-poster-preview-controls')!).display,
      links:[...document.querySelectorAll('.osa-poster-footer a')].map(link => ({href:link.getAttribute('href'),annotation:getComputedStyle(link,'::after').content})),
    };
  });
  expect(layout.width).toBe(8064); expect(layout.height).toBe(4032); expect(layout.transform).toBe('none');
  expect(layout.columns).toHaveLength(4);
  for (const column of layout.columns) expect(column.scroll).toBeLessThanOrEqual(column.client + 1);
  expect(new Set(layout.columns.map(column => column.width)).size).toBe(1);
  expect(layout.footerDisplay).toBe('grid'); expect(layout.controlsDisplay).toBe('none');
  for (const link of layout.links) expect(['none','normal','""']).toContain(link.annotation);
  assertText(await readText(page),true);
  await page.screenshot({path:info.outputPath('poster-print.png'),fullPage:true});
  if (browserName === 'chromium') {
    const pdf = await page.pdf({path:info.outputPath(`osa-poster-${lang}.pdf`),preferCSSPageSize:true,printBackground:true});
    const boxes = [...pdf.toString('latin1').matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)];
    expect(boxes.length).toBeGreaterThan(0);
    for (const box of boxes) { expect(Number(box[1])).toBeCloseTo(6048,0); expect(Number(box[2])).toBeCloseTo(3024,0); }
    expect([...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)]).toHaveLength(1);
  }
  await info.attach('poster-geometry',{contentType:'application/json',body:Buffer.from(JSON.stringify({layout,imageStatus},null,2))});
});

for (const viewport of [{width:1920,height:1080},{width:1366,height:700},{width:1280,height:800}]) test(`slides retain all 12 canvases, title anchors and logo clearance at ${viewport.width}×${viewport.height}`, async ({page},info) => {
  test.setTimeout(90000);
  await page.setViewportSize(viewport);
  await page.goto('/osa/slides-raw/');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.slide img').evaluateAll(images => Promise.all(images.map(image => (image as HTMLImageElement).decode().catch(() => {}))));
  const layout = await page.locator('.slide').evaluateAll(slides => slides.map(slide => {
    const box = slide.getBoundingClientRect(), style = getComputedStyle(slide), h1 = slide.querySelector('.method-title-group h1') as HTMLElement|null;
    const title = h1?.getBoundingClientRect(), logos = slide.querySelector('.header-logos')?.getBoundingClientRect(), divider = slide.querySelector('.method-divider')?.getBoundingClientRect();
    const scale = box.width / 1920;
    return {number:slide.getAttribute('data-slide'),width:parseFloat(style.width),height:parseFloat(style.height),scale,renderedHeight:box.height,
      title:h1 && title ? {size:getComputedStyle(h1).fontSize,x:(title.left-box.left)/scale,y:(title.top-box.top)/scale} : null,
      logoClearance:logos && divider ? (logos.left-divider.right)/scale : null,
      imageFailures:[...slide.querySelectorAll('img')].filter(image => !image.naturalWidth).map(image => image.currentSrc),
    };
  }));
  expect(layout).toHaveLength(12);
  const expectedScale = Math.min(1,viewport.width/1920,viewport.height/1080);
  for (const slide of layout) {
    expect(slide.width).toBe(1920);expect(slide.height).toBe(1080);expect(slide.scale).toBeCloseTo(expectedScale,4);
    expect(slide.renderedHeight).toBeCloseTo(1080*expectedScale,1);
    expect(slide.imageFailures).toEqual([]);
    if (slide.title) {expect(slide.title.size).toBe('54px');expect(slide.title.x).toBeCloseTo(150,1);expect(slide.title.y).toBeCloseTo(76,1);}
    if (slide.logoClearance !== null) expect(slide.logoClearance).toBeGreaterThanOrEqual(0);
  }
  expect(await page.locator('[data-slide="12"] a').count()).toBe(0);
  assertText(await readText(page),true);
  for (const number of [1,2,3,5,9,11,12]) await page.locator(`[data-slide="${number}"]`).screenshot({path:info.outputPath(`slide-${number}.png`)});
  await info.attach('slide-geometry',{contentType:'application/json',body:Buffer.from(JSON.stringify(layout,null,2))});
});
