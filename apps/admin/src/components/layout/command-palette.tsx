'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

const pages = [
  { name: 'Dashboard', href: '/dashboard', group: 'Navigate' },
  { name: 'Products', href: '/products', group: 'Navigate' },
  { name: 'Categories', href: '/categories', group: 'Navigate' },
  { name: 'Tax', href: '/tax', group: 'Navigate' },
  { name: 'Discounts', href: '/discounts', group: 'Navigate' },
  { name: 'Orders', href: '/orders', group: 'Navigate' },
  { name: 'Inventory', href: '/inventory', group: 'Navigate' },
  { name: 'Audit Logs', href: '/audit-logs', group: 'Navigate' },
];

const quickActions = [
  { name: 'New Product', href: '/products/new', group: 'Quick Actions' },
  { name: 'New Discount', href: '/discounts/new', group: 'Quick Actions' },
  { name: 'Stock In', href: '/inventory/stock-in/new', group: 'Quick Actions' },
  { name: 'New Adjustment', href: '/inventory/adjustments/new', group: 'Quick Actions' },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const runCommand = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {pages.map((item) => (
            <CommandItem key={item.href} onSelect={() => runCommand(item.href)}>
              {item.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Quick Actions">
          {quickActions.map((item) => (
            <CommandItem key={item.href} onSelect={() => runCommand(item.href)}>
              {item.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
