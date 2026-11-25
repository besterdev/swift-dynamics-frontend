export type Theme = 'light' | 'dark'

const storageKey = 'theme'
const systemThemeQuery = '(prefers-color-scheme: dark)'
let sessionPreference: Theme | null = null

export const themeInitScript = `(() => {
  let savedTheme;
  try { savedTheme = localStorage.getItem('${storageKey}'); } catch {}
  const theme = savedTheme === 'light' || savedTheme === 'dark'
    ? savedTheme
    : matchMedia('${systemThemeQuery}').matches ? 'dark' : 'light';
  const root = document.documentElement;
  root.classList.add(theme);
  root.style.colorScheme = theme;
})();`

const applyTheme = (theme: Theme) => {
  const root = document.documentElement
  root.classList.toggle('light', theme === 'light')
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}

const readPreference = (): Theme | null => {
  try {
    const value = window.localStorage.getItem(storageKey)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

export const setTheme = (theme: Theme) => {
  sessionPreference = theme
  applyTheme(theme)
  try {
    window.localStorage.setItem(storageKey, theme)
  } catch {
    // The selected theme still applies for this page when storage is unavailable.
  }
}

export const syncThemePreferences = () => {
  const systemTheme = window.matchMedia(systemThemeQuery)
  const sync = () =>
    applyTheme(
      sessionPreference ??
        readPreference() ??
        (systemTheme.matches ? 'dark' : 'light'),
    )

  const syncStorage = (event: StorageEvent) => {
    if (event.key !== storageKey && event.key !== null) return
    sessionPreference = null
    sync()
  }

  sync()
  systemTheme.addEventListener('change', sync)
  window.addEventListener('storage', syncStorage)
  return () => {
    systemTheme.removeEventListener('change', sync)
    window.removeEventListener('storage', syncStorage)
  }
}
