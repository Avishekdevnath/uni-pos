export interface ApiResponse<T> {
  status: "success";
  data: T;
}

export interface PaginatedResponse<T> {
  status: "success";
  data: {
    items: T[];
    pagination: {
      page: number;
      page_size: number;
      total_items: number;
      total_pages: number;
    };
  };
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}
