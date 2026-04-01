'use client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Package,
  Tags,
  Receipt,
  Percent,
  ShoppingCart,
  Warehouse,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navGroups = [
  {
    label: 'Overview',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/products', label: 'Products', icon: Package },
      { href: '/categories', label: 'Categories', icon: Tags },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/tax', label: 'Tax', icon: Receipt },
      { href: '/discounts', label: 'Discounts', icon: Percent },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/inventory', label: 'Inventory', icon: Warehouse },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/audit-logs', label: 'Audit Logs', icon: Shield },
      { href: '/roles', label: 'Roles & Permissions', icon: ShieldCheck },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <span className="font-bold text-lg">uniPOS</span>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
