import { Router } from "express";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
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
  bulkDeleteVehicleReviewSchema,
  reviewStatisticsResponseSchema,
  vehicleReviewIdParamsSchema,
  vehicleReviewStatisticsQuerySchema,
} from "../../schema";
import { adminDeleteVehicleReview, bulkDeleteVehicleReviews, getVehicleReviewStatistics } from "../../controllers/vehicleReview.controller";

const router = Router();

router.use(authenticateToken, AdminOnly);

// Admin tour review routes

router.get("/statistics", getVehicleReviewStatistics);

router.post("/bulk-delete", bulkDeleteVehicleReviews);

router.delete("/:reviewId", adminDeleteVehicleReview);

// Swagger registration

// Get review statistics
registerRoute({
  method: "get",
  path: "/api/admin/vehicle-review/statistics",
  summary: "List of review statistics",
  tags: ["Vehicle Review"],
  security: [{ bearerAuth: [] }],
  request: { query: vehicleReviewStatisticsQuerySchema },
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
  path: "/api/admin/vehicle-review/{reviewId}",
  summary: "Delete vehicle review by id",
  tags: ["Vehicle Review"],
  security: [{ bearerAuth: [] }],
  request: {
    params: vehicleReviewIdParamsSchema,
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
  path: "/api/admin/vehicle-review/bulk-delete",
  summary: "Bulk Delete review ",
  tags: ["Vehicle Review"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: bulkDeleteVehicleReviewSchema } },
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
