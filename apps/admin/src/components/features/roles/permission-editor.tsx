'use client';
import { useState, useEffect, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Permission, RoleWithPermissions } from '@/types/role';
import { updateRolePermissions } from '@/lib/api';

interface PermissionEditorProps {
  roleData: RoleWithPermissions | undefined;
  allPermissions: Permission[];
  isLoading: boolean;
  onSaved: () => void;
}

export function PermissionEditor({
  roleData,
  allPermissions,
  isLoading,
  onSaved,
}: PermissionEditorProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Reset checkboxes whenever the selected role changes
  useEffect(() => {
    if (roleData) {
      setChecked(new Set(roleData.permissions.map((p) => p.code)));
    }
  }, [roleData]);

  // Group all permissions by resource
  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of allPermissions) {
      const list = map.get(p.resource) ?? [];
      list.push(p);
      map.set(p.resource, list);
    }
    return map;
  }, [allPermissions]);

  function toggle(code: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  async function handleSave() {
    if (!roleData) return;
    setIsSaving(true);
    try {
      await updateRolePermissions(roleData.role.id, Array.from(checked));
      toast.success(`Permissions saved for ${roleData.role.name}`);
      onSaved();
    } catch {
      toast.error('Failed to save permissions. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!roleData && !isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a role to manage its permissions
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([resource, permissions]) => (
            <div key={resource}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {resource}
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {permissions.map((p) => (
                  <label
                    key={p.code}
                    className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      checked={checked.has(p.code)}
                      onCheckedChange={() => toggle(p.code)}
                    />
                    <span>{p.action}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t p-4">
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
