'use client';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  debounce?: number;
}

export function SearchInput({ placeholder = 'Search...', value = '', onChange, debounce = 300 }: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const debounced = useDebounce(local, debounce);

  useEffect(() => {
    onChange(debounced);
  }, [debounced, onChange]);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="pl-8"
      />
    </div>
  );
}
