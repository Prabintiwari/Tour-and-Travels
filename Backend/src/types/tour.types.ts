import { DifficultyLevel } from "@prisma/client";

export interface PackageQueryParams {
  page?: string;
  limit?: string;
  destinationId?: string;
  difficultyLevel?: DifficultyLevel;
  isFeatured?: string;
  minPrice?: string;
  maxPrice?: string;
  search?: string;
  discountedOnly?: string;
}
