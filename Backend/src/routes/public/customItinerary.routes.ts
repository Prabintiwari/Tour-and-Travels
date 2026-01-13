import { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import {
  createCustomItinerary,
  deleteMyCustomItinerary,
  getMyCustomItineraries,
  getMyCustomItineraryById,
  updateMyCustomItinerary,
} from "../../controllers/customItinerary.controller";
import { registerRoute } from "../../utils/openapi.utils";
import {
  createCustomItinerarySchema,
  CustomItineraryListResponseSchema,
  customItineraryParamsSchema,
  customItineraryquerySchema,
  CustomItineraryResponseSchema,
  updateCustomItinerarySchema,
} from "../../schema/customItinerary.schema";
import {
  badRequestErrorSchema,
  conflictErrorSchema,
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";

const router = Router();

router.post("/", authenticateToken, createCustomItinerary);

router.patch("/:itineraryId", authenticateToken, updateMyCustomItinerary);

router.get("/", authenticateToken, getMyCustomItineraries);

router.get("/:itineraryId", authenticateToken, getMyCustomItineraryById);

router.delete("/:itineraryId", authenticateToken, deleteMyCustomItinerary);

// Swagger registration
// create a Custom Itinerary
registerRoute({
  method: "post",
  path: "/api/custom-itinerary",
  summary: "Create Custom Itinerary",
  tags: ["Custom-Itinerary"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createCustomItinerarySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Custom Itinerary created",
      content: {
        "application/json": {
          schema: CustomItineraryResponseSchema,
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

// update a Custom Itinerary
registerRoute({
  method: "post",
  path: "/api/custom-itinerary/{itineraryId}",
  summary: "Update Custom Itinerary",
  tags: ["Custom-Itinerary"],
  security: [{ bearerAuth: [] }],
  request: {
    params: customItineraryParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: updateCustomItinerarySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Custom Itinerary updated",
      content: {
        "application/json": {
          schema: CustomItineraryResponseSchema,
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

// Get my Custom Itineraries
registerRoute({
  method: "get",
  path: "/api/custom-itinerary",
  summary: "Get my Custom Itineraries",
  tags: ["Custom-Itinerary"],
  security: [{ bearerAuth: [] }],
  request: {
    query: customItineraryquerySchema,
  },
  responses: {
    200: {
      description: "Get my Custom Itineraries",
      content: {
        "application/json": {
          schema: CustomItineraryListResponseSchema,
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

// Get my Custom Itinerary by Id
registerRoute({
  method: "get",
  path: "/api/custom-itinerary/{itineraryId}",
  summary: "Get my Custom Itinerary by Id",
  tags: ["Custom-Itinerary"],
  security: [{ bearerAuth: [] }],
  request: {
    params: customItineraryParamsSchema,
  },
  responses: {
    200: {
      description: "Get my Custom Itinerary by Id",
      content: {
        "application/json": {
          schema: CustomItineraryListResponseSchema,
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

// Delete my Custom Itinerary
registerRoute({
  method: "delete",
  path: "/api/custom-itinerary/{itineraryId}",
  summary: "Delete my Custom Itinerary",
  tags: ["Custom-Itinerary"],
  security: [{ bearerAuth: [] }],
  request: {
    params: customItineraryParamsSchema,
  },
  responses: {
    200: {
      description: "Delete my Custom Itinerary",
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

export default router;
