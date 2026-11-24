import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

function SidebarProvider({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-sidebar="provider" className={cn('group/sidebar-provider min-h-svh w-full', className)} {...props}/>;
}
function Sidebar({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <aside data-sidebar="sidebar" className={cn('flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground', className)} {...props}/>;
}
function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-sidebar="header" className={cn('flex flex-col gap-2 px-4 pb-5 pt-5', className)} {...props}/>;
}
function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-sidebar="content" className={cn('flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-3', className)} {...props}/>;
}
function SidebarGroup({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section data-sidebar="group" className={cn('min-w-0', className)} {...props}/>;
}
function SidebarGroupLabel({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p data-sidebar="group-label" className={cn('mb-2 px-3 text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground', className)} {...props}/>;
}
function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul data-sidebar="menu" className={cn('flex min-w-0 flex-col gap-1', className)} {...props}/>;
}
function SidebarMenuItem({ className, ...props }: React.LiHTMLAttributes<HTMLLIElement>) {
  return <li data-sidebar="menu-item" className={cn('group/menu-item relative min-w-0', className)} {...props}/>;
}
interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string;
}
function SidebarMenuButton({ asChild = false, isActive = false, className, ...props }: SidebarMenuButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp data-sidebar="menu-button" data-active={isActive} className={cn('peer/menu-button flex h-10 w-full items-center gap-3 overflow-hidden rounded-lg px-3 text-left text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring', 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground', 'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary data-[active=true]:font-semibold', className)} {...props}/>;
}
function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-sidebar="footer" className={cn('mt-auto flex flex-col gap-2 px-3 pb-4 pt-4', className)} {...props}/>;
}
function SidebarSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-sidebar="separator" role="separator" className={cn('mx-3 h-px bg-sidebar-border', className)} {...props}/>;
}
export { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarSeparator };
