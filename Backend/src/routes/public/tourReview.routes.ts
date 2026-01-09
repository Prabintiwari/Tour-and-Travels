import { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createTourReviewSchema,
  destinationIdParamSchema,
  reviewIdParamsSchema,
  reviewIdQuerySchema,
  tourParamsSchema,
  tourReviewResponseSchema,
  updateTourReviewSchema,
  userIdParamSchema,
} from "../../schema";
import {
  canReviewTour,
  createReview,
  deleteReview,
  getDestinationReviews,
  getReviewById,
  getTourReviews,
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

const router = Router();

// Tour review routes
router.post(
  "/",
  authenticateToken,
  validate.body(createTourReviewSchema),
  createReview
);

router.get(
  "/tour/:tourId/can-review",
  authenticateToken,
  validate.params(tourParamsSchema),
  canReviewTour
);

router.get(
  "/tour/:tourId",
  validate.params(tourParamsSchema),
  validate.query(reviewIdQuerySchema),
  getTourReviews
);

router.get(
  "/destination/:destinationId",
  validate.params(destinationIdParamSchema),
  validate.query(reviewIdQuerySchema),
  getDestinationReviews
);

router.get(
  "/user/:userId",
  authenticateToken,
  validate.params(userIdParamSchema),
  validate.query(reviewIdQuerySchema),
  getUserReviews
);

router.get("/:reviewId", validate.params(reviewIdParamsSchema), getReviewById);

router.patch(
  "/:reviewId",
  authenticateToken,
  validate.params(reviewIdParamsSchema),
  validate.body(updateTourReviewSchema),
  updateReview
);

router.delete(
  "/:reviewId",
  authenticateToken,
  validate.params(reviewIdParamsSchema),
  deleteReview
);

// Swagger registration

// Create a new tour review
registerRoute({
  method: "post",
  path: "/api/tour-review",
  summary: "Create tour review",
  tags: ["Tour Review"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: createTourReviewSchema } },
    },
  },
  responses: {
    201: {
      description: "Review created successfully",
      content: { "application/json": { schema: tourReviewResponseSchema } },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Update a new tour review
registerRoute({
  method: "patch",
  path: "/api/tour-review/{reviewId}",
  summary: "Update tour review",
  tags: ["Tour Review"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: updateTourReviewSchema } },
    },
  },
  responses: {
    200: {
      description: "Review updated successfully",
      content: { "application/json": { schema: tourReviewResponseSchema } },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Check if user can review a tour
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

// Get tour reviews by user ID
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

// Get tour reviews by tour ID
registerRoute({
  method: "get",
  path: "/api/tour-review/tour/{tourId}",
  summary: "Get review by tour Id",
  tags: ["Tour Review"],
  request: {
    params: tourParamsSchema,
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

// Get tour reviews by destination ID
registerRoute({
  method: "get",
  path: "/api/tour-review/destination/{destinationId}",
  summary: "Get review by destination Id",
  tags: ["Tour Review"],
  request: {
    params: destinationIdParamSchema,
    query: reviewIdQuerySchema,
  },
  responses: {
    200: {
      description: "Get Destination Review successfully",
      content: { "application/json": { schema: tourReviewResponseSchema } },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get tour reviews by  ID
registerRoute({
  method: "get",
  path: "/api/tour-review/{reviewId}",
  summary: "Get review by Id",
  tags: ["Tour Review"],
  request: {
    params: reviewIdParamsSchema,
  },
  responses: {
    200: {
      description: "Get Review successfully",
      content: { "application/json": { schema: tourReviewResponseSchema } },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Delete tour reviews by  ID
registerRoute({
  method: "delete",
  path: "/api/tour-review/{reviewId}",
  summary: "Delete review by Id",
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

export default router;
