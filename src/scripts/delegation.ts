// Delegated image fallback: when any <img data-image-fallback> fails to load,
// add the `img-placeholder` class so the page can show a placeholder.
document.addEventListener('error', (event) => {
  const target = event.target as HTMLElement | null;
  if (target && target instanceof HTMLImageElement && target.hasAttribute('data-image-fallback')) {
    target.classList.add('img-placeholder');
  }
}, true);

document.addEventListener('click', (event: Event) => {
  const target = event.target as HTMLElement;

  // Theme toggle
  if (target.closest('[data-action="theme-toggle"]')) {
    const isDark = document.documentElement.classList.toggle('dark');
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {}
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#111827' : '#ffffff');
    return;
  }

  // Copy button
  const copyBtn = target.closest('button[data-copy-target]');
  if (copyBtn) {
    const targetId = copyBtn.getAttribute('data-copy-target');
    const label = copyBtn.getAttribute('data-copy-label') || 'Copy';
    const successLabel = copyBtn.getAttribute('data-copy-success') || 'Copied!';
    const source = document.getElementById(targetId || '');
    if (!source) return;

    const text = source.innerText;
    const flashLabel = (iconName: string, message: string) => {
      const icon = copyBtn.querySelector('.copy-icon');
      const span = copyBtn.querySelector('span');
      if (icon) icon.setAttribute('name', iconName);
      if (span) span.textContent = message;
      setTimeout(() => {
        if (icon) icon.setAttribute('name', 'lucide:copy');
        if (span) span.textContent = label;
      }, 2000);
    };
    const showSuccess = () => flashLabel('lucide:check', successLabel);
    const showError = () => flashLabel('lucide:x', 'Copy failed');

    // Legacy / non-secure-context fallback: the async Clipboard API is only
    // available on HTTPS (or localhost). On plain-HTTP previews or older
    // browsers, fall back to the deprecated execCommand path so the button
    // still works instead of silently doing nothing.
    const legacyCopy = (): boolean => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      let ok = false;
      try {
        // `execCommand` is deprecated but remains the only synchronous copy
        // path in non-secure contexts. Access it off a narrowed cast so the
        // deprecated-symbol reference doesn't trip the type-checker's hint.
        const exec = (document as unknown as {
          execCommand?: (command: string) => boolean;
        }).execCommand;
        ok = typeof exec === 'function' ? exec.call(document, 'copy') : false;
      } catch {
        ok = false;
      }
      document.body.removeChild(textarea);
      return ok;
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(showSuccess).catch(() => {
        // Permission denied or transient failure — try the legacy path,
        // and surface an error state if that also fails.
        legacyCopy() ? showSuccess() : showError();
      });
    } else {
      legacyCopy() ? showSuccess() : showError();
    }
  }
});
