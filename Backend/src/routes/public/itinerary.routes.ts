import { Router } from "express";
import {
  getCompleteItinerary,
  getItinerariesByTour,
  getItineraryById,
} from "../../controllers/itinerary.controller";
import { registerRoute } from "../../utils/openapi.utils";
import {
  itineraryIdParamSchema,
  itineraryListResponseSchema,
  itineraryQuerySchema,
  itineraryResponseSchema,
  tourParamsSchema,
} from "../../schema";
import {
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";
import { validateParams } from "../../middleware/validate";

const router = Router();

// Itinerary routes
router.get("/", getCompleteItinerary);
router.get(
  "/:itineraryId",
  getItineraryById
);
router.get(
  "/tour/:tourId",
  getItinerariesByTour
);

// Swagger registration

// Get All Itineraries
registerRoute({
  method: "get",
  path: "/api/itinerary",
  summary: "Get all itineraries",
  tags: ["Itineraries"],
  security: [{ bearerAuth: [] }],
  request: {
    query: itineraryQuerySchema,
  },
  responses: {
    200: {
      description: "Itineraries retrieved successfully",
      content: {
        "application/json": {
          schema: itineraryListResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get Single Itinerary by ID
registerRoute({
  method: "get",
  path: "/api/itinerary/{itineraryId}",
  summary: "Get a single itinerary by ID",
  tags: ["Itineraries"],
  security: [{ bearerAuth: [] }],
  request: {
    params: itineraryIdParamSchema,
  },
  responses: {
    200: {
      description: "Itinerary retrieved successfully",
      content: {
        "application/json": {
          schema: itineraryResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    404: errorResponse(notFoundErrorSchema, "Itinerary not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get Itineraries by Tour ID
registerRoute({
  method: "get",
  path: "/api/itinerary/tour/{tourId}",
  summary: "Get all itineraries for a specific tour",
  tags: ["Itineraries"],
  security: [{ bearerAuth: [] }],
  request: {
    params: tourParamsSchema,
  },
  responses: {
    200: {
      description: "Itineraries retrieved successfully",
      content: {
        "application/json": {
          schema: itineraryListResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    404: errorResponse(notFoundErrorSchema, "Tour not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});
export default router;
