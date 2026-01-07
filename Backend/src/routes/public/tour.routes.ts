import { Router } from "express";
import {
  getAllTours,
  getDefaultGuidePricing,
  getGuidePricingForTour,
  getTourById,
} from "../../controllers/tour.controller";
import {
  defaultGuidePricingResponseSchema,
  tourGuidePricingResponseSchema,
  tourListResponseSchema,
  tourParamsSchema,
  tourQuerySchema,
} from "../../schema";
import { registerRoute } from "../../utils/openapi.utils";
import {
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";
import { authenticateToken } from "../../middleware/auth";
import { validate } from "../../middleware/validate";

const router = Router();

// Tour routes

router.get("/",validate.query(tourQuerySchema), getAllTours);

router.get("/guide-pricing/default", authenticateToken, getDefaultGuidePricing);

router.get("/:tourId/guide-pricing", authenticateToken, getGuidePricingForTour);

router.get("/:tourId", getTourById);

// Swagger registration

// Get all tours
registerRoute({
  method: "get",
  path: "/api/tour",
  summary: "List of tours",
  tags: ["Tours"],
  request: {
    query: tourQuerySchema,
  },
  responses: {
    200: {
      description: "List of tours",
      content: {
        "application/json": {
          schema: tourListResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),

    403: errorResponse(forbiddenErrorSchema, "Forbidden"),

    404: errorResponse(notFoundErrorSchema, "Not Found"),

    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get tour by id
registerRoute({
  method: "get",
  path: "/api/tour/{tourId}",
  summary: "Get tour by Id",
  tags: ["Tours"],
  request: {
    params: tourParamsSchema,
  },
  responses: {
    200: {
      description: "Tour details",
      content: {
        "application/json": {
          schema: tourListResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),

    403: errorResponse(forbiddenErrorSchema, "Forbidden"),

    404: errorResponse(notFoundErrorSchema, "Not Found"),

    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get tour guide pricing
registerRoute({
  method: "get",
  path: "/api/tour/{tourId}/guide-pricing",
  summary: "Get guide pricing for a tour",
  tags: ["Tours"],
  request: {
    params: tourParamsSchema,
  },
  responses: {
    200: {
      description: "Guide pricing for the tour",
      content: {
        "application/json": {
          schema: tourGuidePricingResponseSchema,
        },
      },
    },

    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    404: errorResponse(notFoundErrorSchema, "Guide pricing not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get default guide price
registerRoute({
  method: "get",
  path: "/api/tour/guide-pricing/default",
  summary: "Get default guide pricing",
  tags: ["Tours"],
  responses: {
    200: {
      description: "Get default guide pricing",
      content: {
        "application/json": {
          schema: defaultGuidePricingResponseSchema,
        },
      },
    },

    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    404: errorResponse(notFoundErrorSchema, "Default pricing not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});
export default router;
