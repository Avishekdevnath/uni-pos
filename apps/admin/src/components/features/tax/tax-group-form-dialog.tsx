'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createTaxGroup, updateTaxGroup } from '@/lib/api';
import type { TaxGroup } from '@/types/tax';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({ name: z.string().min(1, 'Name is required') });
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: TaxGroup | null;
}

export function TaxGroupFormDialog({ open, onOpenChange, group }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!group;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) reset({ name: group?.name ?? '' });
  }, [open, group, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEdit ? updateTaxGroup(group!.id, data) : createTaxGroup(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Tax group updated' : 'Tax group created');
      queryClient.invalidateQueries({ queryKey: ['tax-groups'] });
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to save tax group'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Tax Group' : 'New Tax Group'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tg-name">Name *</Label>
            <Input id="tg-name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
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
