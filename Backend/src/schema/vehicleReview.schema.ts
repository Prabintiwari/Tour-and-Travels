import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { paginatedResponse } from "./common.schema";

extendZodWithOpenApi(z);

const createVehicleReviewSchema = z
  .object({
    vehicleId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid vehicle ID")
      .openapi({
        description: "Vehicle ObjectId",
        example: "507f1f77bcf86cd799439011",
      }),
    rating: z
      .number()
      .min(1, "Rating must be at least 1")
      .max(5, "Rating must be at most 5")
      .openapi({
        description: "Rating from 1 to 5",
        example: 4,
      }),
    comment: z
      .string()
      .min(10, "Comment must be at least 10 characters")
      .max(1000, "Comment must not exceed 1000 characters")
      .optional()
      .openapi({
        description: "Review comment (optional)",
        example: "Great vehicle! Very comfortable and clean.",
      }),
  })
  .openapi("CreateVehicleReview");

const updateVehicleReviewSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional().openapi({
      description: "Updated rating from 1 to 5",
      example: 5,
    }),
    comment: z.string().min(10).max(1000).optional().openapi({
      description: "Updated review comment",
      example: "Excellent service and well-maintained vehicle!",
    }),
  })
  .openapi("UpdateVehicleReview");

const vehicleReviewIdQuerySchema = z.object({
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

const getVehicleReviewsQuerySchema = z
  .object({
    vehicleId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid vehicle ID")
      .optional()
      .openapi({
        description: "Filter by vehicle ID",
        example: "507f1f77bcf86cd799439011",
      }),
    userId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID")
      .optional()
      .openapi({
        description: "Filter by user ID",
        example: "507f1f77bcf86cd799439012",
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
  })
  .openapi("GetVehicleReviewsQuery");

const vehicleReviewResponseSchema = z
  .object({
    id: z.string().openapi({ example: "507f1f77bcf86cd799439013" }),
    userId: z.string().openapi({ example: "507f1f77bcf86cd799439014" }),
    vehicleId: z.string().openapi({ example: "507f1f77bcf86cd799439011" }),
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
  .openapi("VehicleReviewResponse");

const vehicleReviewsListResponseSchema = paginatedResponse(
  vehicleReviewResponseSchema,
).openapi("VehicleReviewsListResponse");

const vehicleReviewIdParamsSchema = z.object({
  reviewId: z.string().min(1).openapi({ example: "review_123abc" }),
});

const deleteVehicleReviewParamsSchema = z
  .object({
    reviewId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid review ID")
      .openapi({
        description: "Review ObjectId to delete",
        example: "507f1f77bcf86cd799439013",
      }),
  })
  .openapi("DeleteVehicleReviewParams");

const bulkDeleteVehicleReviewSchema = z
  .object({
    reviewIds: z
      .array(z.string().min(1))
      .min(1, "At least one reviewId is required")
      .openapi({
        example: ["69578dba3760fd1ae30948e5", "69578dba3760fd1ae30948e6"],
      }),
  })
  .openapi("BulkDeleteReview");

export {
  createVehicleReviewSchema,
  updateVehicleReviewSchema,
  getVehicleReviewsQuerySchema,
  vehicleReviewIdParamsSchema,
  vehicleReviewIdQuerySchema,
  deleteVehicleReviewParamsSchema,
  vehicleReviewResponseSchema,
  vehicleReviewsListResponseSchema,
  bulkDeleteVehicleReviewSchema,
};
