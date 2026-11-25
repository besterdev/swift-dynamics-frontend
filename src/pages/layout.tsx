import ThemeToggle from '@/components/theme-toggle'

import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-(--app-header-height) shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <ThemeToggle />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        <footer className="px-4 pb-4 text-center text-muted-foreground text-sm">
          <p>© 2026 Frontend Developer Challenge | Good luck!</p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Layout
