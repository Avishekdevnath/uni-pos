'use client';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '@/lib/api';
import { SearchInput } from '@/components/shared/search-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductFiltersProps {
  search: string;
  categoryId: string;
  status: string;
  onSearchChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onStatusChange: (v: string) => void;
}

export function ProductFilters({
  search,
  categoryId,
  status,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
}: ProductFiltersProps) {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  return (
    <div className="flex flex-wrap gap-3">
      <SearchInput
        placeholder="Search products…"
        value={search}
        onChange={onSearchChange}
        debounce={300}
      />
      <Select value={categoryId || 'all'} onValueChange={(v) => onCategoryChange(v === 'all' ? '' : v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories?.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={status || 'all'} onValueChange={(v) => onStatusChange(v === 'all' ? '' : v)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
