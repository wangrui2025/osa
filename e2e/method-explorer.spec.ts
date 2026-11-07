import { expect, test } from '@playwright/test';

test.describe('OSA interactive method walkthrough', () => {
  test('unfinished A/B work is only a quiet, last-section footer link in both languages', async ({ page }) => {
    for (const [lang, label] of [
      ['en', 'Under development, not ready yet'],
      ['zh', '开发中，还没做好']
    ]) {
      await page.goto(lang + '/');
      await expect(page.locator('[data-development-notice]')).toHaveCount(0);
      await expect(page.getByText('New: explore two interactive OSA explanations')).toHaveCount(0);
      await expect(page.getByText('新体验：两种交互式 OSA 原理解读')).toHaveCount(0);
      const footer = page.locator('[data-ab-development-footer]');
      await expect(footer).toHaveText(label);
      await expect(footer).toHaveAttribute('href', '/osa/' + lang + '/explore/');
      const section = footer.locator('xpath=..');
      const isLast = await section.evaluate(el => el === el.parentElement?.lastElementChild);
      expect(isLast).toBe(true);
      await expect(footer).toHaveCount(1);
    }
  });

  test('feature decomposition changes with sliders and renders pixels', async ({ page }) => {
    await page.goto('en/');
    const demo = page.locator('[data-osa-apfe]');
    await expect(demo.getByRole('heading', { name: 'What does APFE separate?' })).toBeVisible();
    await expect(demo.locator('canvas')).toHaveCount(4);

    const sample = await demo.locator('canvas[data-apfe-canvas="input"]').evaluate((element) => {
      const canvas = element as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      const pixels = ctx?.getImageData(0, 0, canvas.width, canvas.height).data;
      return pixels ? pixels.some((value, index) => index % 4 !== 3 && value > 0) : false;
    });
    expect(sample).toBe(true);

    await demo.locator('[data-apfe-speckle]').fill('83');
    await expect(demo.locator('[data-apfe-speckle-value]')).toHaveText('83%');
    await demo.locator('[data-apfe-attenuation]').fill('72');
    await expect(demo.locator('[data-apfe-attenuation-value]')).toHaveText('72%');
  });

  test('OSU toy follows the expected ideal projection and reset', async ({ page }) => {
    await page.goto('en/');
    const demo = page.locator('[data-osa-osu]');
    await demo.locator('[data-osu-step]').fill('30');
    await expect(demo.locator('[data-osu-step-value]')).toHaveText('30 / 30');

    const baselineSmall = Number(await demo.locator('[data-osu-value="e1"]').textContent());
    const projectedSmall = Number(await demo.locator('[data-osu-value="o1"]').textContent());
    expect(baselineSmall).toBeLessThan(0.2);
    expect(projectedSmall).toBeCloseTo(1, 2);

    await demo.getByRole('button', { name: 'Reset' }).click();
    await expect(demo.locator('[data-osu-step-value]')).toHaveText('0 / 30');
    await expect(demo.locator('[data-osu-value="e1"]')).toHaveText('1.00');
  });

  test('respects reduced motion and retains keyboard stepping', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('en/');
    const demo = page.locator('[data-osa-osu]');
    await demo.getByRole('button', { name: 'Next step' }).click();
    await expect(demo.locator('[data-osu-step-value]')).toHaveText('1 / 30');
    const slider = demo.locator('[data-osu-step]');
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await expect(demo.locator('[data-osu-step-value]')).toHaveText('2 / 30');
    await page.waitForTimeout(550);
    await expect(demo.locator('[data-osu-step-value]')).toHaveText('2 / 30');
  });

  test('Chinese copy and responsive panels survive language navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('zh/');
    const demo = page.locator('[data-osa-explainer]');
    await expect(demo.getByRole('heading', { name: '亲手操作，理解 OSA 的核心机制' })).toBeVisible();
    await expect(demo.locator('canvas')).toHaveCount(4);
    const overflow = await demo.evaluate((element) => element.scrollWidth > element.clientWidth + 2);
    expect(overflow).toBe(false);

    await page.goto('en/');
    await expect(page.locator('[data-osa-explainer]')).toBeVisible();
    await expect(page.locator('[data-osa-osu] [data-osu-step-value]')).toHaveText('0 / 30');
  });
});