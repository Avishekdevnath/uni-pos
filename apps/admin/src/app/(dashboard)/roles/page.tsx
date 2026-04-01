'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchRoles, fetchAllPermissions, fetchRolePermissions } from '@/lib/api';
import { RolesList } from '@/components/features/roles/roles-list';
import { PermissionEditor } from '@/components/features/roles/permission-editor';
import { PageHeader } from '@/components/shared/page-header';

export default function RolesPage() {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });

  const { data: allPermissions = [] } = useQuery({
    queryKey: ['all-permissions'],
    queryFn: fetchAllPermissions,
    staleTime: Infinity,
  });

  const { data: roleData, isLoading: rolePermsLoading } = useQuery({
    queryKey: ['role-permissions', selectedRoleId],
    queryFn: () => fetchRolePermissions(selectedRoleId!),
    enabled: !!selectedRoleId,
  });

  function handleSaved() {
    queryClient.invalidateQueries({ queryKey: ['roles'] });
    queryClient.invalidateQueries({ queryKey: ['role-permissions', selectedRoleId] });
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <PageHeader
        title="Roles & Permissions"
        description="Assign permissions to roles. Changes take effect on the user's next login."
      />

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border">
        {/* Left panel — roles list */}
        <div className="w-64 shrink-0 overflow-y-auto border-r bg-muted/30">
          <RolesList
            roles={roles}
            selectedRoleId={selectedRoleId}
            isLoading={rolesLoading}
            onSelect={setSelectedRoleId}
          />
        </div>

        {/* Right panel — permission editor */}
        <div className="flex-1 overflow-hidden bg-background">
          <PermissionEditor
            roleData={roleData}
            allPermissions={allPermissions}
            isLoading={!!selectedRoleId && rolePermsLoading}
            onSaved={handleSaved}
          />
        </div>
      </div>
    </div>
  );
}
