import { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
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
  canReviewVehicle,
  createVehicleReview,
  deleteVehicleReview,
  getAllVehicleReviews,
  getUserVehicleReviews,
  getVehicleReviewById,
  getVehicleReviews,
  updateVehicleReview,
} from "../../controllers/vehicleReview.controller";
import {
  userIdParamSchema,
  vehicleParamsSchema,
  createVehicleReviewSchema,
  getVehicleReviewsQuerySchema,
  updateVehicleReviewSchema,
  userVehicleReviewsQuerySchema,
  vehicleReviewIdParamsSchema,
  vehicleReviewIdQuerySchema,
  vehicleReviewResponseSchema,
  vehicleReviewsListResponseSchema,
} from "../../schema";

const router = Router();

// Vehicle review routes
router.post("/", authenticateToken, createVehicleReview);

router.get("/", getAllVehicleReviews);

router.get(
  "/vehicle/:vehicleId/can-review",
  authenticateToken,
  canReviewVehicle,
);

router.get("/vehicle/:vehicleId", getVehicleReviews);

router.get("/user/:userId", authenticateToken, getUserVehicleReviews);

router.get("/:reviewId", getVehicleReviewById);

router.patch("/:reviewId", authenticateToken, updateVehicleReview);

router.delete("/:reviewId", authenticateToken, deleteVehicleReview);

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
    params: vehicleReviewIdParamsSchema,
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

// Get all vehicle reviews
registerRoute({
  method: "get",
  path: "/api/vehicle-review",
  summary: "List of all vehicle reviews",
  tags: ["Vehicle Review"],
  security: [{ bearerAuth: [] }],
  request: { query: getVehicleReviewsQuerySchema },
  responses: {
    200: {
      description: "Get all vehicle Review successfully",
      content: {
        "application/json": {
          schema: vehicleReviewsListResponseSchema,
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

// Check if user can review a vehicle
registerRoute({
  method: "get",
  path: "/api/vehicle-review/vehicle/{vehicleId}/can-review",
  summary: "Check if user can review a vehicle",
  tags: ["Vehicle Review"],
  security: [{ bearerAuth: [] }],
  request: {
    params: vehicleParamsSchema,
  },
  responses: {
    200: {
      description: "Check if user can review a vehicle",
      content: { "application/json": { schema: vehicleReviewResponseSchema } },
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
  path: "/api/vehicle-review/user/{userId}",
  summary: "Get review by user Id",
  tags: ["Vehicle Review"],
  security: [{ bearerAuth: [] }],
  request: {
    params: userIdParamSchema,
    query: userVehicleReviewsQuerySchema,
  },
  responses: {
    200: {
      description: "Get Vehicle Review successfully",
      content: {
        "application/json": { schema: vehicleReviewsListResponseSchema },
      },
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
      content: {
        "application/json": { schema: vehicleReviewsListResponseSchema },
      },
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
    params: vehicleReviewIdParamsSchema,
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
