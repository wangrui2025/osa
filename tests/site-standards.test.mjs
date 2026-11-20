import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calendarParts, conferenceDate, formatCalendar } from '../src/utils/date-format.mjs';
import { inspectSource, inspectHtml } from '../scripts/check-site-standards.mjs';
const css = ':root{--osa-contract-version:1}body{font-family:var(--osa-font-body);font-size:var(--osa-text-body)}';
const document = body => `<html data-site-standards="osa-v1"><body>${body}</body></html>`;
test('calendar-only projection preserves source precision, validates leap days, and never shifts zones', () => {
  for (const zone of ['UTC','Pacific/Honolulu','Asia/Shanghai']) {
    process.env.TZ = zone;
    assert.equal(formatCalendar('2026-06-07','zh'), '2026年6月7日');
    assert.equal(formatCalendar('2026-06-07','en'), '2026-06-07');
    assert.equal(formatCalendar('2026-06','zh'), '2026年6月');
    assert.equal(formatCalendar('2026','en'), '2026');
    assert.equal(calendarParts('2024-02-29').precision, 'day');
  }
  for (const invalid of ['2026-02-29','2026-13','0000','2026-4-2','2026-06-01T00:00:00Z']) assert.throws(() => formatCalendar(invalid));
});
test('the conference field adapts legacy month labels without inventing a day or modifying source data', () => {
  assert.equal(conferenceDate('June 2026'), '2026-06');
  assert.equal(conferenceDate('2026年6月'), '2026-06');
  assert.throws(() => conferenceDate('Fall 2026'));
});
test('source guards reject typography, spacing, width, and SVG bypasses in content, not just shell', () => {
  for (const bad of ['<style>.main{font-size:19px}</style>','<style>.main{font-size:var(--osa-missing-role)}</style>','<style>body{font:16px Arial}</style>','<style>.article{line-height:1.234}</style>','<style>.article{line-height:0}</style>','<style>.article{padding:17px}</style>','<style>.article{padding:calc(var(--osa-space-unit) + 17px)}</style>','<style>.article{margin:var(--osa-space-unit) -17px}</style>','<style>.slide-viewport p{max-width:999px}</style>','<style>.article{max-width:calc(var(--osa-width-prose) + 17px)}</style>','<style>.article{max-width:999px}</style>','<p class="text-3xl">Title</p>','<svg><text font-size="13">x</text></svg>']) assert.ok(inspectSource(bad,'bad.astro').length, bad);
  assert.deepEqual(inspectSource('<style>.main{font-size:var(--osa-text-body);padding:calc(var(--osa-space-unit)*4)}</style>','good.astro'), []);
});
test('output guards reject detached styles and dates including raw text in a standards shell', () => {
  assert.ok(inspectHtml(document('<p>Body</p>'), ':root{--osa-contract-version:1}', 'detached').length);
  assert.ok(inspectHtml('<body>Unconnected</body>', css).length);
  for (const bad of ['June 7, 2026','June 2026','2026 年 6 月 7 日','2026-06-07','06/07/2026','<time datetime="2026-06-07" data-calendar="day" data-calendar-lang="zh">June 7</time>']) assert.ok(inspectHtml(document(bad), css).length, bad);
  const good = '<time datetime="2026-06-07" data-calendar="day" data-calendar-lang="zh">2026年6月7日</time><time datetime="2026-06" data-calendar="month" data-calendar-lang="en">2026-06</time><pre><code>month={June} 2026-06-07</code></pre><script type="application/ld+json">{"datePublished":"2026-06-01"}</script><a href="/2026-06-07/">CVPR 2026</a>';
  assert.deepEqual(inspectHtml(document(good), css), []);
});
