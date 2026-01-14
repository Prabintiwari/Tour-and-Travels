import { Router } from "express";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
import {
  createCustomItinerary,
  getAllCustomItinerariesAdmin,
} from "../../controllers/customItinerary.controller";
import { registerRoute } from "../../utils/openapi.utils";
import {
  admincustomItineraryquerySchema,
  createCustomItinerarySchema,
  CustomItineraryListResponseSchema,
  customItineraryParamsSchema,
  CustomItineraryResponseSchema,
} from "../../schema/customItinerary.schema";
import {
  badRequestErrorSchema,
  conflictErrorSchema,
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";
import {
  getAllCustomItineraryEventsAdmin,
  getCustomItineraryEventsByIdAdmin,
  getCustomItineraryEventsByItineraryIdAdmin,
} from "../../controllers/cusotmItineraryEvents.controller";
import {
  adminCustomItineraryEventQuerySchema,
  customItineraryEventListResponseSchema,
  customItineraryEventParamsSchema,
  customItineraryEventQuerySchema,
  customItineraryEventResponseSchema,
} from "../../schema/customItineraryEvent.schema";

const router = Router();

router.use(authenticateToken, AdminOnly);

router.get("/", getAllCustomItinerariesAdmin);

router.get("/events", getAllCustomItineraryEventsAdmin);

router.get("/events/:eventId", getCustomItineraryEventsByIdAdmin);

router.get("/:itineraryId/events", getCustomItineraryEventsByItineraryIdAdmin);

router.get("/:itineraryId", getAllCustomItinerariesAdmin);

// Swagger registration

// Get Custom Itineraries
registerRoute({
  method: "get",
  path: "/api/admin/custom-itinerary",
  summary: "Get Custom Itineraries",
  tags: ["Custom-Itinerary"],
  security: [{ bearerAuth: [] }],
  request: {
    query: admincustomItineraryquerySchema,
  },
  responses: {
    200: {
      description: "Get Custom Itineraries",
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

// Get Custom Itinerary by Id
registerRoute({
  method: "get",
  path: "/api/admin/custom-itinerary/{itineraryId}",
  summary: "Get Custom Itinerary by Id",
  tags: ["Custom-Itinerary"],
  security: [{ bearerAuth: [] }],
  request: {
    params: customItineraryParamsSchema,
  },
  responses: {
    200: {
      description: "Get Custom Itinerary by Id",
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

// Get Custom Itinerary Events
registerRoute({
  method: "get",
  path: "/api/admin/custom-itinerary/events",
  summary: "Get Custom Itinerarary Events",
  tags: ["Custom-Itinerary"],
  security: [{ bearerAuth: [] }],
  request: {
    query: adminCustomItineraryEventQuerySchema,
  },
  responses: {
    200: {
      description: "Get Custom Itinerarary Events",
      content: {
        "application/json": {
          schema: customItineraryEventListResponseSchema,
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

// Get Custom Itinerary Events by Id
registerRoute({
  method: "get",
  path: "/api/admin/custom-itinerary/events/{eventId}",
  summary: "Get Custom Itinerarary Event by Id",
  tags: ["Custom-Itinerary"],
  security: [{ bearerAuth: [] }],
  request: {
    params: customItineraryEventParamsSchema,
  },
  responses: {
    200: {
      description: "Get Custom Itinerarary Event by Id",
      content: {
        "application/json": {
          schema: customItineraryEventResponseSchema,
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

// Get Custom Itinerary Events by Itinerary Id
registerRoute({
  method: "get",
  path: "/api/admin/custom-itinerary/{itineraryId}/events",
  summary: "Get Custom Itinerary Events by Itinerary Id",
  tags: ["Custom-Itinerary"],
  security: [{ bearerAuth: [] }],
  request: {
    params: customItineraryParamsSchema,
    query: customItineraryEventQuerySchema,
  },
  responses: {
    200: {
      description: "Get Custom Itinerary Events Itinerary by Id",
      content: {
        "application/json": {
          schema: customItineraryEventListResponseSchema,
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

export default router;
