import { test, expect } from '@playwright/test';

test.describe('OSA A/B explorable paper prototypes', () => {
  test('two entries change the hierarchy but keep science and controls identical', async ({ page }) => {
    await page.goto('en/explore/video-first/');
    const a = page.locator('[data-osa-study]');
    await expect(a).toHaveAttribute('data-variant', 'video-first');
    await expect(a.getByRole('heading', { name: /What does losing a direction/ })).toBeVisible();
    const aGeometry = await a.locator('[data-geometry-lab]').innerText();
    const aVideoY = await a.locator('.study-video-block').evaluate(el => el.getBoundingClientRect().top);
    const aFlowY = await a.locator('.study-flow-block').evaluate(el => el.getBoundingClientRect().top);
    expect(Math.abs(aVideoY - aFlowY)).toBeLessThan(3);

    await page.goto('en/explore/network-first/');
    const b = page.locator('[data-osa-study]');
    await expect(b).toHaveAttribute('data-variant', 'network-first');
    const bFlowY = await b.locator('.study-flow-block').evaluate(el => el.getBoundingClientRect().top);
    const bVideoY = await b.locator('.study-video-block').evaluate(el => el.getBoundingClientRect().top);
    expect(bFlowY).toBeLessThan(bVideoY);
    expect(await b.locator('[data-geometry-lab]').innerText()).toBe(aGeometry);
    await expect(b.locator('[data-apfe-canvas]')).toHaveCount(4);
    await expect(b.locator('[data-osu-step]')).toHaveCount(1);
  });

  test('motion simulation and clickable nodes respond without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('en/explore/video-first/');
    await expect(page.locator('[data-frame-output]')).toHaveText('00 / 30');
    const hasPixels = await page.locator('[data-study-scan]').evaluate(el => {
      const canvas = el as HTMLCanvasElement;
      const data = canvas.getContext('2d')?.getImageData(160, 100, 10, 10).data;
      return Boolean(data && data.some((v, i) => i % 4 !== 3 && v > 0));
    });
    expect(hasPixels).toBe(true);
    await page.locator('[data-study-time]').fill('17');
    await expect(page.locator('[data-frame-output]')).toHaveText('17 / 30');
    await page.locator('[data-study-node="osu"]').click();
    await expect(page.locator('[data-study-node="osu"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-study-panel="osu"]')).toBeVisible();
    await page.locator('[data-study-reset]').click();
    await expect(page.locator('[data-frame-output]')).toHaveText('00 / 30');
    expect(errors).toEqual([]);
  });

  test('geometry lab makes singular value and condition number interpretable', async ({ page }) => {
    await page.goto('en/explore/network-first/');
    const lab = page.locator('[data-geometry-lab]');
    await lab.locator('[data-study-preset="90"]').click();
    await expect(lab.locator('[data-sigma-readout]')).toHaveText('1.000');
    await expect(lab.locator('[data-condition-readout]')).toHaveText('1.00');
    await lab.locator('[data-study-preset="10"]').click();
    const minSingular = Number(await lab.locator('[data-sigma-readout]').textContent());
    const condition = Number(await lab.locator('[data-condition-readout]').textContent());
    expect(minSingular).toBeLessThan(.2);
    expect(condition).toBeGreaterThan(10);
    await lab.getByText('What is the condition number?').click();
    await expect(lab.getByText(/Divide the biggest stretch by the smallest/)).toBeVisible();
    await expect(lab.getByText(/These are an exact calculation/)).toHaveCount(0);
  });

  test('mobile Chinese page keeps the controls readable without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 440, height: 956 });
    await page.goto('zh/explore/video-first/');
    await expect(page.getByRole('heading', { name: '从一次心跳开始。' })).toBeVisible();
    await expect(page.getByText('最小奇异值', { exact: true })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    expect(overflow).toBe(false);
    await page.goto('zh/explore/network-first/');
    await expect(page.getByRole('heading', { name: '打开模型，追踪信息流。' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)).toBe(false);
  });

  test('comparison route and home affordance link to both preview versions', async ({ page }) => {
    await page.goto('en/');
    await expect(page.getByRole('link', { name: /Compare A and B/i })).toHaveAttribute('href', '/osa/en/explore/');
    await page.goto('en/explore/');
    await expect(page.getByRole('heading', { name: /How should a paper teach its own idea/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Explore version A/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Explore version B/ })).toBeVisible();
    const feedback = page.locator('[data-comparison-form]');
    await feedback.locator('input[value="B"]').check();
    await feedback.locator('textarea').fill('I understand OSU better from the flow diagram.');
    await expect(feedback.getByRole('button', { name: /Copy feedback/ })).toBeVisible();
    await expect(page.getByText(/This static site does not send or save your response/)).toBeVisible();
  });

  test('reduced-motion mode does not auto-run the synthetic video', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('en/explore/video-first/');
    await expect(page.locator('[data-frame-output]')).toHaveText('00 / 30');
    await page.waitForTimeout(400);
    await expect(page.locator('[data-frame-output]')).toHaveText('00 / 30');
    await page.locator('[data-study-play]').click();
    await expect(page.locator('[data-frame-output]')).toHaveText('01 / 30');
  });
});
