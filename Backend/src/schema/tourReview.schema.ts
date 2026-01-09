import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { paginatedResponse } from "./common.schema";

extendZodWithOpenApi(z);

const createTourReviewSchema = z
  .object({
     tourId: z.string().min(1, "Tour ID is required"),
    rating: z.number().int().min(1).max(5).openapi({
      description: "Rating from 1 to 5",
      example: 5,
    }),
    comment: z.string().min(10).max(1000).optional().openapi({
      description: "Review comment",
      example:
        "Amazing tour! The guide was knowledgeable and the scenery was breathtaking.",
    }),
  })
  .openapi("CreateTourReview");

const updateTourReviewSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional().openapi({
      description: "Rating from 1 to 5",
      example: 4,
    }),
    comment: z.string().min(10).max(1000).optional().openapi({
      description: "Review comment",
      example: "Updated review comment",
    }),
  })
  .openapi("UpdateTourReview");

const tourReviewResponseSchema = z
  .object({
    id: z.string().openapi({ example: "507f1f77bcf86cd799439013" }),
    userId: z.string().openapi({ example: "507f1f77bcf86cd799439014" }),
    tourId: z.string().openapi({ example: "507f1f77bcf86cd799439011" }),
    destinationId: z.string().openapi({ example: "507f1f77bcf86cd799439012" }),
    rating: z.number().openapi({ example: 5 }),
    comment: z.string().optional().openapi({ example: "Great experience!" }),
    user: z
      .object({
        fullName: z.string(),
        profileImage: z.string().nullable(),
      })
      .optional(),
    createdAt: z.string().openapi({ example: "2024-01-01T00:00:00.000Z" }),
    updatedAt: z.string().openapi({ example: "2024-01-01T00:00:00.000Z" }),
  })
  .openapi("TourReviewResponse");

const tourReviewsListResponseSchema = paginatedResponse(
  tourReviewResponseSchema
).openapi("TourReviewsListResponse");

// Query parameter schemas
const reviewQuerySchema = z.object({
  tourId: z.string().optional().openapi({
    example: "tour_123abc",
    description: "Filter by tour ID",
  }),
  destinationId: z.string().optional().openapi({
    example: "dest_123abc",
    description: "Filter by destination ID",
  }),
  userId: z.string().optional().openapi({
    example: "user_123abc",
    description: "Filter by user ID",
  }),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  rating: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(5))
    .optional(),
  sortBy: z.string().optional().openapi({
    example: "startDate",
    description: "Sort by field",
  }),
  sortOrder: z.string().optional().default("asc").openapi({
    example: "asc",
    description: "Sort order",
  }),
});

const reviewIdQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  rating: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(5))
    .optional(),
  sortBy: z.string().optional().openapi({
    example: "startDate",
    description: "Sort by field",
  }),
  sortOrder: z.string().optional().default("asc").openapi({
    example: "asc",
    description: "Sort order",
  }),
})

type CreateTourReviewInput = z.infer<typeof createTourReviewSchema>;
type UpdateTourReviewInput = z.infer<typeof updateTourReviewSchema>;
type ReviewQueryParams = z.infer<typeof reviewQuerySchema>;
type ReviewIdQueryParams = z.infer<typeof reviewIdQuerySchema>;

export {
  createTourReviewSchema,
  updateTourReviewSchema,
  tourReviewResponseSchema,
  tourReviewsListResponseSchema,
  reviewQuerySchema,
  CreateTourReviewInput,
  UpdateTourReviewInput,
  ReviewQueryParams,
  reviewIdQuerySchema,
  ReviewIdQueryParams,
};
