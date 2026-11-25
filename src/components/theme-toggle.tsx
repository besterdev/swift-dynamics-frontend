import { useEffect, useId } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useTheme } from '@/hooks/use-theme'
import { setTheme, syncThemePreferences } from '@/lib/theme'

const ThemeToggle = () => {
  const id = useId()
  const dark = useTheme() === 'dark'
  const Icon = dark ? Moon : Sun

  useEffect(syncThemePreferences, [])

  return (
    <label
      htmlFor={id}
      className="flex h-9 cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-2.5 text-xs font-medium text-foreground"
    >
      <Icon className="size-[15px] text-muted-foreground" aria-hidden="true" />
      <span className="w-8" aria-hidden="true">
        {dark ? 'Dark' : 'Light'}
      </span>
      <Switch
        id={id}
        aria-label="Dark mode"
        checked={dark}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      />
    </label>
  )
}

export default ThemeToggle
