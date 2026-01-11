import { Router } from "express";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
import {
  adminDeleteReview,
  bulkDeleteReviews,
  getAllReviews,
  getReviewById,
  getReviewStatistics,
} from "../../controllers/tourReview.controller";
import { registerRoute } from "../../utils/openapi.utils";
import {
  badRequestErrorSchema,
  conflictErrorSchema,
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";
import {
  bulkDeleteReviewSchema,
  reviewIdParamsSchema,
  reviewStatisticsQuerySchema,
  reviewStatisticsResponseSchema,
  tourReviewsListResponseSchema,
} from "../../schema";
import { validateQuery, validateRequest } from "../../middleware/validate";

const router = Router();

router.use(authenticateToken, AdminOnly);

// Admin tour review routes

router.get("/", getAllReviews);

router.get("/statistics", getReviewStatistics);
router.post("/bulk-delete", bulkDeleteReviews);
router.delete("/:reviewId", adminDeleteReview);

// Swagger registration

// Get all reviews
registerRoute({
  method: "get",
  path: "/api/admin/tour-review",
  summary: "List of all reviews",
  tags: ["Tour Review"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Get all Review successfully",
      content: {
        "application/json": {
          schema: tourReviewsListResponseSchema,
        },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get review statistics
registerRoute({
  method: "get",
  path: "/api/admin/tour-review/statistics",
  summary: "List of review statistics",
  tags: ["Tour Review"],
  security: [{ bearerAuth: [] }],
  request: { query: reviewStatisticsQuerySchema },
  responses: {
    200: {
      description: "Get all Review statistics successfully",
      content: {
        "application/json": {
          schema: reviewStatisticsResponseSchema,
        },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Delete reviews by ID
registerRoute({
  method: "delete",
  path: "/api/admin/tour-review/{reviewId}",
  summary: "Delete review by id",
  tags: ["Tour Review"],
  security: [{ bearerAuth: [] }],
  request: {
    params: reviewIdParamsSchema,
  },
  responses: {
    200: {
      description: "Review deleted successfully",
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Bulk Delete reviews
registerRoute({
  method: "post",
  path: "/api/admin/tour-review/bulk-delete",
  summary: "Bulk Delete review ",
  tags: ["Tour Review"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: bulkDeleteReviewSchema } },
    },
  },
  responses: {
    200: {
      description: "Review's deleted successfully",
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});
export default router;
