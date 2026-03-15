'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchTaxGroups, archiveTaxGroup, fetchTaxConfigs, archiveTaxConfig } from '@/lib/api';
import { useBranch } from '@/hooks/use-branch';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable } from '@/components/shared/data-table';
import { getTaxGroupColumns } from '@/components/features/tax/tax-group-columns';
import { getTaxConfigColumns } from '@/components/features/tax/tax-config-columns';
import { TaxGroupFormDialog } from '@/components/features/tax/tax-group-form-dialog';
import { TaxConfigFormDialog } from '@/components/features/tax/tax-config-form-dialog';
import type { TaxGroup, TaxConfig } from '@/types/tax';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TaxPage() {
  const queryClient = useQueryClient();
  const { selectedBranch } = useBranch();

  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<TaxGroup | null>(null);
  const [archiveGroupTarget, setArchiveGroupTarget] = useState<TaxGroup | null>(null);

  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<TaxConfig | null>(null);
  const [archiveConfigTarget, setArchiveConfigTarget] = useState<TaxConfig | null>(null);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['tax-groups'],
    queryFn: fetchTaxGroups,
  });

  const { data: configs = [] } = useQuery({
    queryKey: ['tax-configs', { groupId: expandedGroupId, branchId: selectedBranch?.id }],
    queryFn: () =>
      fetchTaxConfigs({
        branch_id: selectedBranch?.id,
        tax_group_id: expandedGroupId ?? undefined,
      }),
    enabled: !!expandedGroupId && !!selectedBranch,
  });

  const archiveGroupMutation = useMutation({
    mutationFn: (id: string) => archiveTaxGroup(id),
    onSuccess: () => {
      toast.success('Tax group archived');
      queryClient.invalidateQueries({ queryKey: ['tax-groups'] });
      setArchiveGroupTarget(null);
    },
    onError: () => toast.error('Failed to archive tax group'),
  });

  const archiveConfigMutation = useMutation({
    mutationFn: (id: string) => archiveTaxConfig(id),
    onSuccess: () => {
      toast.success('Tax config archived');
      queryClient.invalidateQueries({ queryKey: ['tax-configs'] });
      setArchiveConfigTarget(null);
    },
    onError: () => toast.error('Failed to archive tax config'),
  });

  const groupColumns = getTaxGroupColumns(
    expandedGroupId,
    (id) => setExpandedGroupId(expandedGroupId === id ? null : id),
    (group) => { setEditGroup(group); setGroupDialogOpen(true); },
    (group) => setArchiveGroupTarget(group),
  );

  const configColumns = getTaxConfigColumns(
    (config) => { setEditConfig(config); setConfigDialogOpen(true); },
    (config) => setArchiveConfigTarget(config),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Tax" description="Manage tax groups and rate configurations">
        <Button onClick={() => { setEditGroup(null); setGroupDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tax Group
        </Button>
      </PageHeader>

      <DataTable
        columns={groupColumns}
        data={groups}
        isLoading={isLoading}
        emptyMessage="No tax groups found."
      />

      {expandedGroupId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Tax Configs — {groups.find((g) => g.id === expandedGroupId)?.name}
            </CardTitle>
            <Button
              size="sm"
              onClick={() => { setEditConfig(null); setConfigDialogOpen(true); }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Config
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={configColumns}
              data={configs}
              emptyMessage="No tax configs for this group."
            />
          </CardContent>
        </Card>
      )}

      <TaxGroupFormDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        group={editGroup}
      />

      {expandedGroupId && (
        <TaxConfigFormDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          config={editConfig}
          taxGroupId={expandedGroupId}
        />
      )}

      {archiveGroupTarget && (
        <ConfirmDialog
          title="Archive Tax Group"
          description={`Archive "${archiveGroupTarget.name}"?`}
          confirmLabel="Archive"
          variant="destructive"
          onConfirm={() => archiveGroupMutation.mutate(archiveGroupTarget.id)}
          trigger={<span />}
        />
      )}
      {archiveConfigTarget && (
        <ConfirmDialog
          title="Archive Tax Config"
          description={`Archive "${archiveConfigTarget.name}"?`}
          confirmLabel="Archive"
          variant="destructive"
          onConfirm={() => archiveConfigMutation.mutate(archiveConfigTarget.id)}
          trigger={<span />}
        />
      )}
    </div>
  );
}
