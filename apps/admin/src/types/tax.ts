export interface TaxGroup {
  id: string;
  name: string;
  status: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxConfig {
  id: string;
  name: string;
  rate: number;
  isInclusive: boolean;
  sortOrder: number;
  status: string;
  tenantId: string;
  branchId: string;
  taxGroupId: string;
  taxGroup?: TaxGroup;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxGroupInput {
  name: string;
}

export interface UpdateTaxGroupInput {
  name?: string;
  status?: string;
}

export interface CreateTaxConfigInput {
  branch_id: string;
  tax_group_id: string;
  name: string;
  rate: number;
  is_inclusive?: boolean;
  sort_order?: number;
}

export interface UpdateTaxConfigInput {
  name?: string;
  rate?: number;
  is_inclusive?: boolean;
  sort_order?: number;
  status?: string;
  tax_group_id?: string;
}
