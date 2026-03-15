'use client';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '@/lib/api';
import type { CreateAdjustmentInput } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';

const schema = z.object({
  description: z.string().optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid('Select a product'),
        quantity: z.coerce.number().refine((v) => v !== 0, 'Quantity cannot be 0'),
        note: z.string().optional(),
      }),
    )
    .min(1, 'At least one item is required'),
});
type FormData = z.infer<typeof schema>;

interface AdjustmentFormProps {
  onSubmit: (data: CreateAdjustmentInput) => Promise<unknown>;
  isSubmitting: boolean;
  branchId: string;
}

export function AdjustmentForm({ onSubmit, isSubmitting, branchId }: AdjustmentFormProps) {
  const { data: productsResp } = useQuery({
    queryKey: ['products', { branchId }],
    queryFn: () => fetchProducts({ branch_id: branchId, page_size: 200 }),
  });
  const products = productsResp?.data?.items ?? [];

  const { register, handleSubmit, setValue, control, watch, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { items: [{ product_id: '', quantity: 1, note: '' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit({ branch_id: branchId, description: data.description, items: data.items }),
      )}
      className="space-y-6 max-w-2xl"
    >
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea placeholder="Optional note…" {...register('description')} />
      </div>

      <div className="space-y-3">
        <Label>Items *</Label>
        {fields.map((field, index) => {
          const productId = watch(`items.${index}.product_id`);
          return (
            <div key={field.id} className="flex gap-3 items-end">
              <div className="flex-1 space-y-1">
                {index === 0 && <Label className="text-xs text-muted-foreground">Product</Label>}
                <Select
                  value={productId}
                  onValueChange={(v) => setValue(`items.${index}.product_id`, v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-28 space-y-1">
                {index === 0 && <Label className="text-xs text-muted-foreground">Qty (±)</Label>}
                <Input type="number" {...register(`items.${index}.quantity`)} />
              </div>
              <div className="flex-1 space-y-1">
                {index === 0 && <Label className="text-xs text-muted-foreground">Note</Label>}
                <Input placeholder="Reason…" {...register(`items.${index}.note`)} />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        {errors.items && (
          <p className="text-sm text-destructive">{errors.items.message}</p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ product_id: '', quantity: 1, note: '' })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save Adjustment'}
      </Button>
    </form>
  );
}
