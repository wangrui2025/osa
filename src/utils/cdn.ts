/**
 * Academic asset CDN — single source of truth for the jsDelivr base URL
 * that serves `mykcs/academic` images. Pin to a commit/tag for cache
 * stability; bump here when the academic repo is updated.
 *
 * Used by: HomePage, Poster, PosterHeader, LangSwitcher, Layout, Footer.
 * (Previously also listed "slides" — that page is now generated at build
 * time by `src/integrations/build-slides-html.mjs` and uses the
 * ACADEMIC_CDN_BASE constant directly via a small inline transform.)
 */
const ACADEMIC_CDN_VERSION = 'v1.1.0';
const ACADEMIC_REPO = 'mykcs/academic';
export const ACADEMIC_CDN_BASE = `https://cdn.jsdelivr.net/gh/${ACADEMIC_REPO}@${ACADEMIC_CDN_VERSION}/images`;

/**
 * Build a CDN URL for an academic image path. Accepts paths with or
 * without a leading `/` and with or without the `images/` prefix
 * (e.g. "logos/szu.svg", "/academic/images/logos/szu.svg", or
 * "publications/cvpr2026-osa/fig/first/fig_first.png" all work).
 */
export function getAcademicImage(path: string): string {
  // Strip leading slash, and strip `/academic/images/` or `images/`
  // prefix so the caller can use either repo-rooted or runtime-URL
  // style paths.
  const normalized = path
    .replace(/^\/+/, '')
    .replace(/^academic\/images\//, '')
    .replace(/^images\//, '');
  return `${ACADEMIC_CDN_BASE}/${normalized}`;
}
