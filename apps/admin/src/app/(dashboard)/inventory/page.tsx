'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBranch } from '@/hooks/use-branch';
import { fetchInventoryBalances, fetchInventoryMovements } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { SearchInput } from '@/components/shared/search-input';
import { balanceColumns } from '@/components/features/inventory/balance-columns';
import { movementColumns } from '@/components/features/inventory/movement-columns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function InventoryPage() {
  const { selectedBranch } = useBranch();

  const [balancePage, setBalancePage] = useState(1);
  const [balancePageSize, setBalancePageSize] = useState(20);
  const [balanceSearch, setBalanceSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);

  const [movPage, setMovPage] = useState(1);
  const [movPageSize, setMovPageSize] = useState(20);
  const [movType, setMovType] = useState('');

  const { data: balances = [], isLoading: balancesLoading } = useQuery({
    queryKey: ['inventory-balances', { branchId: selectedBranch?.id, balancePage, balancePageSize, balanceSearch, lowStock }],
    queryFn: () =>
      fetchInventoryBalances({
        branch_id: selectedBranch!.id,
        page: balancePage,
        page_size: balancePageSize,
        ...(balanceSearch ? { search: balanceSearch } : {}),
        ...(lowStock ? { low_stock: true } : {}),
      }),
    enabled: !!selectedBranch,
  });

  const { data: movements = [], isLoading: movementsLoading } = useQuery({
    queryKey: ['inventory-movements', { branchId: selectedBranch?.id, movPage, movPageSize, movType }],
    queryFn: () =>
      fetchInventoryMovements({
        branch_id: selectedBranch!.id,
        page: movPage,
        page_size: movPageSize,
        ...(movType ? { type: movType } : {}),
      }),
    enabled: !!selectedBranch,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory">
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/inventory/stock-in/new">Stock In</Link>
          </Button>
          <Button asChild>
            <Link href="/inventory/adjustments/new">
              <Plus className="mr-2 h-4 w-4" />
              Adjustment
            </Link>
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="balances">
        <TabsList>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="mt-4">
          <DataTable
            columns={balanceColumns}
            data={balances}
            isLoading={balancesLoading}
            emptyMessage="No inventory data found."
            toolbar={
              <div className="flex items-center gap-3">
                <SearchInput
                  placeholder="Search products…"
                  value={balanceSearch}
                  onChange={(v) => { setBalanceSearch(v); setBalancePage(1); }}
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="low-stock"
                    checked={lowStock}
                    onCheckedChange={(v) => { setLowStock(!!v); setBalancePage(1); }}
                  />
                  <Label htmlFor="low-stock">Low stock only</Label>
                </div>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          <DataTable
            columns={movementColumns}
            data={movements}
            isLoading={movementsLoading}
            emptyMessage="No movements found."
            toolbar={
              <Select value={movType || 'all'} onValueChange={(v) => { setMovType(v === 'all' ? '' : v); setMovPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="stock_in">Stock In</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                </SelectContent>
              </Select>
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
