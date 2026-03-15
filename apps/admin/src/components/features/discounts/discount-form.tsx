'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { DiscountPreset } from '@/types/discount';
import { BranchAssignment } from './branch-assignment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const discountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['percentage', 'flat']),
  value: z.coerce.number().min(0, 'Value must be >= 0'),
  scope: z.enum(['order', 'line_item']),
  max_discount_amount: z.coerce.number().optional().nullable(),
  min_order_amount: z.coerce.number().optional().nullable(),
  valid_from: z.string().optional().nullable(),
  valid_until: z.string().optional().nullable(),
  is_combinable: z.boolean(),
});

export type DiscountFormData = z.infer<typeof discountSchema> & { branch_ids: string[] };

interface DiscountFormProps {
  defaultValues?: Partial<DiscountPreset>;
  defaultBranchIds?: string[];
  onSubmit: (data: DiscountFormData) => Promise<unknown>;
  isSubmitting: boolean;
}

export function DiscountForm({ defaultValues, defaultBranchIds = [], onSubmit, isSubmitting }: DiscountFormProps) {
  const [branchIds, setBranchIds] = useState<string[]>(defaultBranchIds);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      type: (defaultValues?.type as 'percentage' | 'flat') ?? 'percentage',
      value: defaultValues?.value ?? 0,
      scope: (defaultValues?.scope as 'order' | 'line_item') ?? 'order',
      max_discount_amount: defaultValues?.maxDiscountAmount ?? null,
      min_order_amount: defaultValues?.minOrderAmount ?? null,
      valid_from: defaultValues?.validFrom ?? null,
      valid_until: defaultValues?.validUntil ?? null,
      is_combinable: defaultValues?.isCombinable ?? false,
    },
  });

  const type = watch('type');
  const scope = watch('scope');
  const isCombinable = watch('is_combinable');

  const handleFormSubmit = handleSubmit((data) =>
    onSubmit({ ...data, branch_ids: branchIds }),
  );

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label>Name *</Label>
        <Input {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type *</Label>
          <Select value={type} onValueChange={(v) => setValue('type', v as 'percentage' | 'flat')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="flat">Flat</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Value *</Label>
          <Input type="number" step="0.01" {...register('value')} />
          {errors.value && <p className="text-sm text-destructive">{errors.value.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Scope *</Label>
        <Select value={scope} onValueChange={(v) => setValue('scope', v as 'order' | 'line_item')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="order">Order</SelectItem>
            <SelectItem value="line_item">Line item</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Max Discount</Label>
          <Input type="number" step="0.01" placeholder="No limit" {...register('max_discount_amount')} />
        </div>
        <div className="space-y-2">
          <Label>Min Order Amount</Label>
          <Input type="number" step="0.01" placeholder="No minimum" {...register('min_order_amount')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valid From</Label>
          <Input type="date" {...register('valid_from')} />
        </div>
        <div className="space-y-2">
          <Label>Valid Until</Label>
          <Input type="date" {...register('valid_until')} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="combinable"
          checked={isCombinable}
          onCheckedChange={(v) => setValue('is_combinable', !!v)}
        />
        <Label htmlFor="combinable">Combinable with other discounts</Label>
      </div>

      <div className="space-y-2">
        <Label>Branch Restrictions</Label>
        <BranchAssignment value={branchIds} onChange={setBranchIds} />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save Discount'}
      </Button>
    </form>
  );
}
