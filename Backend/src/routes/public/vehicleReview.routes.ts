import { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import {
  reviewIdParamsSchema,
  reviewIdQuerySchema,
  tourParamsSchema,
  tourReviewResponseSchema,
  updateTourReviewSchema,
  userIdParamSchema,
  vehicleParamsSchema,
} from "../../schema";
import {
  canReviewTour,
  deleteReview,
  getReviewById,
  getUserReviews,
  updateReview,
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
import { createVehicleReview, deleteVehicleReview, getVehicleReviewById, getVehicleReviews, updateVehicleReview } from "../../controllers/vehicleReview.controller";
import { createVehicleReviewSchema, updateVehicleReviewSchema, vehicleReviewIdParamsSchema, vehicleReviewIdQuerySchema, vehicleReviewResponseSchema, vehicleReviewsListResponseSchema } from "../../schema/vehicleReview.schema";

const router = Router();

// Vehicle review routes
router.post(
  "/",
  authenticateToken,
  createVehicleReview
);

router.get(
  "/vehicle/:vehicleId/can-review",
  authenticateToken,
  canReviewTour
);

router.get(
  "/vehicle/:vehicleId",
  getVehicleReviews
);

router.get(
  "/user/:userId",
  authenticateToken,
  getUserReviews
);

router.get("/:reviewId", getVehicleReviewById);

router.patch(
  "/:reviewId",
  authenticateToken,
  updateVehicleReview
);

router.delete(
  "/:reviewId",
  authenticateToken,
  deleteVehicleReview
);

// Swagger registration

// Create a new vehicle review
registerRoute({
  method: "post",
  path: "/api/vehicle-review",
  summary: "Create vehicle review",
  tags: ["Vehicle Review"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: createVehicleReviewSchema } },
    },
  },
  responses: {
    201: {
      description: "Review created successfully",
      content: { "application/json": { schema: vehicleReviewResponseSchema } },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Update a new vehicle review
registerRoute({
  method: "patch",
  path: "/api/vehicle-review/{reviewId}",
  summary: "Update tour review",
  tags: ["Vehicle Review"],
  security: [{ bearerAuth: [] }],
  request: {
    params:vehicleReviewIdParamsSchema,
    body: {
      content: { "application/json": { schema: updateVehicleReviewSchema } },
    },
  },
  responses: {
    200: {
      description: "Review updated successfully",
      content: { "application/json": { schema: vehicleReviewResponseSchema } },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Check if user can review a vehicle
registerRoute({
  method: "get",
  path: "/api/tour-review/tour/{tourId}/can-review",
  summary: "Check if user can review a tour",
  tags: ["Tour Review"],
  security: [{ bearerAuth: [] }],
  request: {
    params: tourParamsSchema,
  },
  responses: {
    200: {
      description: "Check if user can review a tour",
      content: { "application/json": { schema: tourReviewResponseSchema } },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get vehicle reviews by user ID
registerRoute({
  method: "get",
  path: "/api/tour-review/user/{userId}",
  summary: "Get review by user Id",
  tags: ["Tour Review"],
  security: [{ bearerAuth: [] }],
  request: {
    params: userIdParamSchema,
    query: reviewIdQuerySchema,
  },
  responses: {
    200: {
      description: "Get Tour Review successfully",
      content: { "application/json": { schema: tourReviewResponseSchema } },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get vehicle reviews by vehicle ID
registerRoute({
  method: "get",
  path: "/api/vehicle-review/vehicle/{vehicleId}",
  summary: "Get review by vehicle Id",
  tags: ["Vehicle Review"],
  request: {
    params: vehicleParamsSchema,
    query: vehicleReviewIdQuerySchema,
  },
  responses: {
    200: {
      description: "Get Vehicle Review successfully",
      content: { "application/json": { schema: vehicleReviewsListResponseSchema } },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get vehicle reviews by  ID
registerRoute({
  method: "get",
  path: "/api/vehicle-review/{reviewId}",
  summary: "Get review by Id",
  tags: ["Vehicle Review"],
  request: {
    params: reviewIdParamsSchema,
  },
  responses: {
    200: {
      description: "Get Review successfully",
      content: { "application/json": { schema: vehicleReviewResponseSchema } },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Delete vehicle reviews by  ID
registerRoute({
  method: "delete",
  path: "/api/vehicle-review/{reviewId}",
  summary: "Delete review by Id",
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

export default router;
