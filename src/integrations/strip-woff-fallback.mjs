#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Astro Integration: strip-woff-fallback
 *
 * Strips the woff (non-woff2) fallback from Noto Sans @font-face declarations
 * in CSS, then removes the corresponding woff files from dist/_astro/.
 *
 * Why: @fontsource/noto-sans ships woff + woff2. Modern browsers (>97%)
 * support woff2, so the woff fallback only adds ~464K of download for users
 * who can't use woff2 anyway.
 *
 * Note: Unlike GDKVM (which inlines CSS into HTML), OSA keeps CSS as external
 * files in dist/_astro/*.css, so we strip woff url() from BOTH HTML and CSS.
 */
function stripWoffFallback() {
  return {
    name: 'strip-woff-fallback',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const distDir = fileURLToPath(dir);
        console.log('[strip-woff-fallback] Running on dir:', distDir);

        // 1. Remove noto-sans-*.woff files from dist/_astro/
        //    KaTeX_*.woff files are preserved (used for math rendering).
        const astroDir = path.join(distDir, '_astro');
        let removedFiles = 0;
        let bytesRemoved = 0;
        if (fs.existsSync(astroDir)) {
          for (const entry of fs.readdirSync(astroDir)) {
            if (entry.startsWith('noto-sans-') && entry.endsWith('.woff')) {
              const full = path.join(astroDir, entry);
              const size = fs.statSync(full).size;
              fs.unlinkSync(full);
              removedFiles++;
              bytesRemoved += size;
            }
          }
        }
        console.log(
          `[strip-woff-fallback] Removed ${removedFiles} noto-sans-*.woff files (${(bytesRemoved / 1024).toFixed(0)}KB)`
        );

        // 2. Strip `,url(.../noto-sans-...woff) format("woff")` from any
        //    inlined CSS in HTML files AND from external CSS files in dist/_astro/.
        //    The woff url() in @fontsource CSS always comes AFTER the woff2 url()
        //    and is preceded by a comma, so we can safely remove the tail.
        function findFiles(dir, ext) {
          const results = [];
          try {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
              const full = path.join(dir, entry.name);
              if (entry.isDirectory()) results.push(...findFiles(full, ext));
              else if (entry.name.endsWith(ext)) results.push(full);
            }
          } catch {}
          return results;
        }

        const htmlFiles = findFiles(distDir, '.html');
        const cssFiles = fs.existsSync(astroDir) ? findFiles(astroDir, '.css') : [];
        const allFiles = [...htmlFiles, ...cssFiles];

        let filesTouched = 0;
        let totalBytesRemoved = 0;

        for (const filePath of allFiles) {
          let content = fs.readFileSync(filePath, 'utf-8');
          const before = content.length;

          // Match the woff fallback as ",url(PATH.woff) format("woff")" or
          // ",url(PATH.woff) format('woff')". Keep the woff2 part.
          content = content.replace(
            /,url\(\/[^)"']*noto-sans-[^)"']*\.woff\)\s*format\((['"])woff\1\)/g,
            ''
          );

          if (content.length !== before) {
            fs.writeFileSync(filePath, content, 'utf-8');
            filesTouched++;
            totalBytesRemoved += before - content.length;
          }
        }

        console.log(
          `[strip-woff-fallback] Stripped woff fallback from ${filesTouched} files (${htmlFiles.length} HTML + ${cssFiles.length} CSS, ${(totalBytesRemoved / 1024).toFixed(1)}KB removed)`
        );
        console.log(
          `[strip-woff-fallback] Total savings: ${((bytesRemoved + totalBytesRemoved) / 1024).toFixed(0)}KB`
        );
        console.log('[strip-woff-fallback] Done');
      },
    },
  };
}

export default stripWoffFallback;
