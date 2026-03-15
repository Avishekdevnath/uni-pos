'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createTaxConfig, updateTaxConfig } from '@/lib/api';
import type { TaxConfig } from '@/types/tax';
import { useBranch } from '@/hooks/use-branch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  rate: z.coerce.number().min(0).max(100, 'Rate must be 0-100'),
  is_inclusive: z.boolean(),
  branch_id: z.string().uuid('Select a branch'),
  sort_order: z.coerce.number().int().min(0),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: TaxConfig | null;
  taxGroupId: string;
}

export function TaxConfigFormDialog({ open, onOpenChange, config, taxGroupId }: Props) {
  const queryClient = useQueryClient();
  const { branches } = useBranch();
  const isEdit = !!config;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  });

  useEffect(() => {
    if (open) {
      reset({
        name: config?.name ?? '',
        rate: config?.rate ?? 0,
        is_inclusive: config?.isInclusive ?? false,
        branch_id: config?.branchId ?? '',
        sort_order: config?.sortOrder ?? 0,
      });
    }
  }, [open, config, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEdit
        ? updateTaxConfig(config!.id, { ...data, tax_group_id: taxGroupId })
        : createTaxConfig({ ...data, tax_group_id: taxGroupId }),
    onSuccess: () => {
      toast.success(isEdit ? 'Tax config updated' : 'Tax config created');
      queryClient.invalidateQueries({ queryKey: ['tax-configs'] });
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to save tax config'),
  });

  const isInclusive = watch('is_inclusive');
  const branchId = watch('branch_id');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Tax Config' : 'New Tax Config'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rate (%) *</Label>
              <Input type="number" step="0.01" {...register('rate')} />
              {errors.rate && <p className="text-sm text-destructive">{errors.rate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" {...register('sort_order')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Branch *</Label>
            <Select value={branchId ?? ''} onValueChange={(v) => setValue('branch_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.branch_id && <p className="text-sm text-destructive">{errors.branch_id.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="inclusive"
              checked={isInclusive}
              onCheckedChange={(v) => setValue('is_inclusive', !!v)}
            />
            <Label htmlFor="inclusive">Tax inclusive</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
