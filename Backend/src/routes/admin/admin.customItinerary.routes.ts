import { Router } from "express";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
import { createCustomItinerary, getAllCustomItinerariesAdmin } from "../../controllers/customItinerary.controller";
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

const router = Router();

router.use(authenticateToken, AdminOnly);

router.get("/", getAllCustomItinerariesAdmin);

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

export default router;
