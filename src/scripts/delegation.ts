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
    const showSuccess = () => {
      const icon = copyBtn.querySelector('.copy-icon');
      const span = copyBtn.querySelector('span');
      if (icon) icon.setAttribute('name', 'lucide:check');
      if (span) span.textContent = successLabel;
      setTimeout(() => {
        if (icon) icon.setAttribute('name', 'lucide:copy');
        if (span) span.textContent = label;
      }, 2000);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(showSuccess).catch(() => {});
    }
  }
});
