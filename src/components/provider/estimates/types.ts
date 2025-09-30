import type { Category, Estimate } from "@prisma/client";

export interface EstimateDto extends Estimate {
  category?: Category | null;
}

export type EstimateSort = "created_desc" | "created_asc" | "name_asc" | "name_desc";
export type ViewedFilter = "ALL" | "viewed" | "unviewed";

export interface EstimateListParams {
  search?: string;
  viewed?: ViewedFilter;
  sort?: EstimateSort;
}
