import { useSyncExternalStore } from 'react'
import type { Theme } from '@/lib/theme'

const subscribe = (notify: () => void) => {
  const observer = new MutationObserver(notify)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

const getTheme = (): Theme =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light'

const getServerTheme = (): Theme => 'light'

export const useTheme = () =>
  useSyncExternalStore(subscribe, getTheme, getServerTheme)
