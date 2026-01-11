import { Router } from "express";
import {
  getAllDestinations,
  getAllRegions,
  getDestinationById,
  getDestinationStats,
  getPopularDestinations,
} from "../../controllers/destination.controller";
import { registerRoute } from "../../utils/openapi.utils";
import {
  destinationIdParamSchema,
  destinationResponseSchema,
  getAllDestinationsQuerySchema,
} from "../../schema";
import {
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";
import { validateParams, validateQuery } from "../../middleware/validate";

const router = Router();

// Destination routes
router.get(
  "/",
  validateQuery(getAllDestinationsQuerySchema),
  getAllDestinations
);
router.get("/popular-destination", getPopularDestinations);
router.get("/regions", getAllRegions);
router.get(
  "/stats/:destinationId",
  validateParams(destinationIdParamSchema),
  getDestinationStats
);
router.get(
  "/:destinationId",
  validateParams(destinationIdParamSchema),
  getDestinationById
);

// Swagger registration

// Get all destination
registerRoute({
  method: "get",
  path: "/api/destinations",
  summary: "List of Destinations",
  tags: ["Destinations"],
  request: {
    query: getAllDestinationsQuerySchema,
  },
  responses: {
    200: {
      description: "List of Destinations",
      content: {
        "application/json": {
          schema: destinationResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),

    403: errorResponse(forbiddenErrorSchema, "Forbidden"),

    404: errorResponse(notFoundErrorSchema, "Not Found"),

    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// get destination by Id
registerRoute({
  method: "get",
  path: "/api/destinations/{destinationId}",
  summary: "Get destination by Id",
  tags: ["Destinations"],
  request: {
    params: destinationIdParamSchema,
  },
  responses: {
    200: {
      description: "Destination details",
      content: {
        "application/json": {
          schema: destinationResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),

    403: errorResponse(forbiddenErrorSchema, "Forbidden"),

    404: errorResponse(notFoundErrorSchema, "Not Found"),

    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get popular destination
registerRoute({
  method: "get",
  path: "/api/destinations/popular-destination",
  summary: "List of popular Destinations",
  tags: ["Destinations"],
  responses: {
    200: {
      description: "List of popular Destinations",
      content: {
        "application/json": {
          schema: destinationResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),

    403: errorResponse(forbiddenErrorSchema, "Forbidden"),

    404: errorResponse(notFoundErrorSchema, "Not Found"),

    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// get all region
registerRoute({
  method: "get",
  path: "/api/destinations/regions",
  summary: "List of Destinations region",
  tags: ["Destinations"],
  responses: {
    200: {
      description: "List of Destinations region",
      content: {
        "application/json": {
          schema: destinationResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),

    403: errorResponse(forbiddenErrorSchema, "Forbidden"),

    404: errorResponse(notFoundErrorSchema, "Not Found"),

    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// get destination stats
registerRoute({
  method: "get",
  path: "/api/destinations/stats/{destinationId}",
  summary: "List of Destination stats",
  tags: ["Destinations"],
  request: { Param: destinationIdParamSchema },
  responses: {
    200: {
      description: "List of Destination stats",
      content: {
        "application/json": {
          schema: destinationResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),

    403: errorResponse(forbiddenErrorSchema, "Forbidden"),

    404: errorResponse(notFoundErrorSchema, "Not Found"),

    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

export default router;
