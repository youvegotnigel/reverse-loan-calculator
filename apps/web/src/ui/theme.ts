/**
 * Theme handling: follow prefers-color-scheme until the user chooses
 * explicitly, then persist that choice.
 */
export function initTheme(toggle: HTMLButtonElement): void {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  const isDark = (): boolean => {
    const explicit = document.documentElement.dataset.theme;
    if (explicit === 'dark') return true;
    if (explicit === 'light') return false;
    return systemDark.matches;
  };

  toggle.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
  });
}
