'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchTaxGroups } from '@/lib/api';
import type { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  category_id: z.string().uuid('Select a category').optional().nullable(),
  tax_group_id: z.string().uuid().optional().nullable(),
  price: z.coerce.number().min(0, 'Price must be >= 0'),
  cost: z.coerce.number().min(0, 'Cost must be >= 0'),
  unit: z.string().min(1, 'Select a unit'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  defaultValues?: Partial<Product>;
  onSubmit: (data: ProductFormData) => Promise<unknown>;
  isSubmitting: boolean;
}

const UNITS = ['piece', 'kg', 'liter', 'pack', 'box', 'dozen'];

export function ProductForm({ defaultValues, onSubmit, isSubmitting }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: defaultValues?.name ?? '',
      sku: defaultValues?.sku ?? '',
      barcode: defaultValues?.barcode ?? '',
      category_id: defaultValues?.categoryId ?? null,
      tax_group_id: defaultValues?.taxGroupId ?? null,
      price: defaultValues?.price ?? 0,
      cost: defaultValues?.cost ?? 0,
      unit: defaultValues?.unit ?? 'piece',
    },
  });

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const { data: taxGroups } = useQuery({ queryKey: ['tax-groups'], queryFn: fetchTaxGroups });

  const categoryId = watch('category_id');
  const taxGroupId = watch('tax_group_id');
  const unit = watch('unit');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU *</Label>
          <Input id="sku" {...register('sku')} />
          {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="barcode">Barcode</Label>
          <Input id="barcode" {...register('barcode')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={categoryId ?? 'none'}
          onValueChange={(v) => setValue('category_id', v === 'none' ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No category</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Tax Group</Label>
        <Select
          value={taxGroupId ?? 'none'}
          onValueChange={(v) => setValue('tax_group_id', v === 'none' ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="No tax group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No tax group</SelectItem>
            {taxGroups?.map((tg) => (
              <SelectItem key={tg.id} value={tg.id}>{tg.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price *</Label>
          <Input id="price" type="number" step="0.01" {...register('price')} />
          {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cost">Cost *</Label>
          <Input id="cost" type="number" step="0.01" {...register('cost')} />
          {errors.cost && <p className="text-sm text-destructive">{errors.cost.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Unit *</Label>
        <Select value={unit} onValueChange={(v) => setValue('unit', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNITS.map((u) => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save Product'}
      </Button>
    </form>
  );
}
