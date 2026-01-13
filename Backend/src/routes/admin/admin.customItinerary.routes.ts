import { Router } from "express";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
import { createCustomItinerary } from "../../controllers/customItinerary.controller";
import { registerRoute } from "../../utils/openapi.utils";
import {
  createCustomItinerarySchema,
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

router.post("/", createCustomItinerary);

// Swagger registration
// create a Custom Itinerary
registerRoute({
  method: "post",
  path: "/api/admin/custom-itinerary",
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

export default router;
