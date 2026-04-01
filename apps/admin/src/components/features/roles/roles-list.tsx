'use client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { RoleWithCount } from '@/types/role';
import { cn } from '@/lib/utils';

interface RolesListProps {
  roles: RoleWithCount[];
  selectedRoleId: string | null;
  isLoading: boolean;
  onSelect: (roleId: string) => void;
}

export function RolesList({ roles, selectedRoleId, isLoading, onSelect }: RolesListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <ul className="space-y-1 p-4">
      {roles.map((role) => (
        <li key={role.id}>
          <button
            onClick={() => onSelect(role.id)}
            className={cn(
              'w-full rounded-lg px-4 py-3 text-left transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              selectedRoleId === role.id
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-foreground',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">{role.name}</span>
              <div className="flex shrink-0 items-center gap-2">
                {role.isSystem && (
                  <Badge variant="secondary" className="text-xs">
                    System
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {role.permissionCount}p
                </span>
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
