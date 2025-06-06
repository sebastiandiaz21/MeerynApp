
'use client';

import * as React from "react"; // Added React import
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UserCog, Settings, ChevronsLeft, ChevronsRight, Sun, Moon, Laptop, Sparkles } from 'lucide-react'; 
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'; 
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';

export default function Sidemenu() {
  const pathname = usePathname();
  const { state, isMobile, toggleSidebar, setOpenMobile } = useSidebar();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const commonButtonProps = (path: string) => ({
    isActive: pathname === path || (path === '/admin' && pathname.startsWith('/admin')) || (path === '/settings' && pathname.startsWith('/settings')),
    variant: 'default' as const,
    className: 'w-full justify-start text-base h-12 rounded-lg',
    tooltip: state === 'collapsed' && !isMobile ? (path === '/' ? 'Inicio' : path === '/admin' ? 'Tutor' : 'Ajustes') : undefined,
  });

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false); 
    }
  };

  const NavIcon = ({ icon: Icon }: { icon: React.ElementType }) => (
    <Icon className="h-6 w-6 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7" />
  );
  
  const ThemeToggle = () => {
    if (!mounted || !theme || (theme === 'system' && !resolvedTheme)) {
      if (state === 'collapsed' && !isMobile) {
        return (
          <SidebarMenuButton
            variant="ghost"
            className="w-full justify-center text-lg h-12 rounded-lg opacity-50 cursor-default"
            tooltip="Cargando tema..."
            disabled
          >
            <Sun className="h-6 w-6 animate-pulse text-muted-foreground" />
          </SidebarMenuButton>
        );
      }
      return (
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 group-data-[collapsible=icon]:hidden">
          <span className="text-sm font-medium text-muted-foreground">Tema</span>
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      );
    }

    const currentDisplayTheme = theme === 'system' ? resolvedTheme : theme;

    if (state === 'collapsed' && !isMobile) {
      return (
        <SidebarMenuButton
          onClick={() => setTheme(currentDisplayTheme === 'light' ? 'dark' : 'light')}
          variant="ghost"
          className="w-full justify-center text-lg h-12 rounded-lg"
          tooltip={currentDisplayTheme === 'light' ? 'Tema Oscuro' : 'Tema Claro'}
        >
          {currentDisplayTheme === 'light' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
        </SidebarMenuButton>
      );
    }
    return (
      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 group-data-[collapsible=icon]:hidden">
        <span className="text-sm font-medium text-muted-foreground">Tema</span>
        <div className="flex gap-1">
          <Button variant={currentDisplayTheme === 'light' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTheme('light')} className="h-8 w-8 rounded-md">
            <Sun className="h-5 w-5" />
          </Button>
          <Button variant={currentDisplayTheme === 'dark' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTheme('dark')} className="h-8 w-8 rounded-md">
            <Moon className="h-5 w-5" />
          </Button>
          <Button variant={theme === 'system' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTheme('system')} className="h-8 w-8 rounded-md">
            <Laptop className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  };

  if (!mounted) {
    // Render a simplified version or placeholders during SSR and initial hydration
    // to avoid theme-dependent logic causing mismatches.
    // This part mainly affects the ThemeToggle if it were complex.
    // For now, the main Sidemenu structure is mostly static.
  }


  return (
    <Sidebar collapsible={isMobile ? "offcanvas" : "icon"} side="left" variant="sidebar" className="shadow-lg">
      <SidebarHeader className="flex items-center justify-between p-3 sm:p-4 border-b border-sidebar-border">
         <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
            <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-accent transition-transform group-hover:scale-110 group-hover:rotate-[15deg]" />
            <h2 className="font-headline text-xl sm:text-2xl font-semibold group-data-[collapsible=icon]:hidden text-primary">Meeryn-Bee</h2>
         </div>
      </SidebarHeader>

      <SidebarContent className="p-2 sm:p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" passHref legacyBehavior>
              <SidebarMenuButton {...commonButtonProps('/')} onClick={handleLinkClick}>
                <NavIcon icon={Home} />
                <span className="group-data-[collapsible=icon]:hidden">Inicio</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/admin" passHref legacyBehavior>
              <SidebarMenuButton {...commonButtonProps('/admin')} onClick={handleLinkClick}>
                <NavIcon icon={UserCog} />
                <span className="group-data-[collapsible=icon]:hidden">Panel del Tutor</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 sm:p-3 border-t border-sidebar-border space-y-2">
        <ThemeToggle /> 
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/settings" passHref legacyBehavior>
              <SidebarMenuButton {...commonButtonProps('/settings')} onClick={handleLinkClick}>
                <NavIcon icon={Settings} />
                <span className="group-data-[collapsible=icon]:hidden">Ajustes</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
           {!isMobile && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={toggleSidebar}
                variant="ghost"
                className="w-full justify-start text-base h-12 rounded-lg hover:bg-sidebar-accent/70"
                tooltip={
                  !isMobile && state === 'collapsed' 
                    ? 'Abrir Menú' 
                    : !isMobile && state === 'expanded' 
                      ? 'Cerrar Menú' 
                      : undefined
                }
              >
                {state === 'expanded' ? <ChevronsLeft className="h-6 w-6" /> : <ChevronsRight className="h-6 w-6" />}
                <span className="group-data-[collapsible=icon]:hidden">
                  {state === 'expanded' ? 'Cerrar Menú' : 'Abrir Menú'}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
           )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
