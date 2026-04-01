'use client';
import { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogOut, User, ChevronDown, Search } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useBranch } from '@/hooks/use-branch';
import { Breadcrumbs } from './breadcrumbs';
import { CommandPalette } from './command-palette';
import { useRouter } from 'next/navigation';

export function AppHeader() {
  const { user, logout } = useAuth();
  const { branches, selectedBranch, selectBranch } = useBranch();
  const router = useRouter();
  const [cmdOpen, setCmdOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumbs />
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <div className="ml-auto flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-2 text-muted-foreground" onClick={() => setCmdOpen(true)}>
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline pointer-events-none rounded border bg-muted px-1 text-xs">⌘K</kbd>
        </Button>
        {branches.length > 1 && (
          <Select value={selectedBranch?.id ?? ''} onValueChange={selectBranch}>
            <SelectTrigger className="h-8 w-40">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {selectedBranch && branches.length <= 1 && (
          <span className="text-sm text-muted-foreground">{selectedBranch.name}</span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="max-w-[120px] truncate">{user?.fullName ?? user?.email}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="flex flex-col gap-1">
              <span className="font-medium">{user?.fullName}</span>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
              {user?.role && (
                <Badge variant="secondary" className="w-fit text-xs capitalize">
                  {user.role.name}
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
