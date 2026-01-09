import { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createTourReviewSchema,
  reviewIdQuerySchema,
  reviewQuerySchema,
  tourParamsSchema,
  tourResponseSchema,
  tourReviewResponseSchema,
} from "../../schema";
import {
  createReview,
  getTourReviews,
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
  "/tour/:tourId",
  validate.params(tourParamsSchema),
  validate.query(reviewQuerySchema),
  getTourReviews
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
    body: { content: { "application/json": { schema: tourResponseSchema } } },
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

// Get tour reviews by tour ID
registerRoute({
  method: "get",
  path: "/api/tour-review/tour/{tourId}",
  summary: "Get tour review by Id",
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

export default router;
