'use client';
import { useState } from 'react';
import { useBranch } from '@/hooks/use-branch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, X, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BranchAssignmentProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function BranchAssignment({ value, onChange }: BranchAssignmentProps) {
  const { branches } = useBranch();
  const [open, setOpen] = useState(false);

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const selectedBranches = branches.filter((b) => value.includes(b.id));

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selectedBranches.length === 0
              ? 'All branches (no restriction)'
              : `${selectedBranches.length} branch${selectedBranches.length > 1 ? 'es' : ''} selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Search branches…" />
            <CommandList>
              <CommandEmpty>No branches found.</CommandEmpty>
              <CommandGroup>
                {branches.map((b) => (
                  <CommandItem key={b.id} onSelect={() => toggle(b.id)}>
                    <Check className={cn('mr-2 h-4 w-4', value.includes(b.id) ? 'opacity-100' : 'opacity-0')} />
                    {b.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedBranches.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedBranches.map((b) => (
            <Badge key={b.id} variant="secondary" className="gap-1">
              {b.name}
              <button onClick={() => toggle(b.id)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
