import { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { getMyCustomItineraries } from "../../controllers/customItinerary.controller";
import { registerRoute } from "../../utils/openapi.utils";
import {
  CustomItineraryListResponseSchema,
  customItineraryquerySchema,
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

router.get("/", authenticateToken, getMyCustomItineraries);

// Swagger registration

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

export default router;
