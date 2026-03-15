export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  status: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  parent_id?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  parent_id?: string | null;
}
