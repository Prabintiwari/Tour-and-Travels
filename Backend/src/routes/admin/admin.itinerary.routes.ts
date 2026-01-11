import { Router } from "express";
import {
  addActivity,
  createItinerary,
  deleteItinerary,
  removeActivity,
  updateItinerary,
} from "../../controllers/itinerary.controller";
import {
  activityOperationResponseSchema,
  addActivitiesSchema,
  createItinerarySchema,
  itineraryIdParamSchema,
  itineraryResponseSchema,
  removeActivitiesSchema,
  updateItinerarySchema,
} from "../../schema";
import { validateParams, validateRequest } from "../../middleware/validate";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
import { registerRoute } from "../../utils/openapi.utils";
import {
  badRequestErrorSchema,
  conflictErrorSchema,
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";
import z from "zod";

const router = Router();
router.use(authenticateToken, AdminOnly);

// Admin itinerary routes
router.post("/", validateRequest(createItinerarySchema), createItinerary);
router.patch(
  "/:itineraryId",
  validateParams(itineraryIdParamSchema),
  validateRequest(updateItinerarySchema),
  updateItinerary
);

router.delete(
  "/:itineraryId",
  validateParams(itineraryIdParamSchema),
  deleteItinerary
);

router.patch(
  "/:itineraryId/add-activities",
  validateParams(itineraryIdParamSchema),
  validateRequest(addActivitiesSchema),
  addActivity
);

router.delete(
  "/:itineraryId/remove-activities",
  validateParams(itineraryIdParamSchema),
  removeActivity
);

// Swagger registration

// Create a new Itinerary
registerRoute({
  method: "post",
  path: "/api/admin/itinerary",
  summary: "Create a new itinerary",
  tags: ["Itineraries"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createItinerarySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Itinerary created successfully",
      content: {
        "application/json": {
          schema: itineraryResponseSchema,
        },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(
      conflictErrorSchema,
      "Itinerary already exists for this day"
    ),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Update a itinerary
registerRoute({
  method: "patch",
  path: "/api/admin/itinerary/{itineraryId}",
  summary: "Update an itinerary",
  tags: ["Itineraries"],
  security: [{ bearerAuth: [] }],
  request: {
    params: itineraryIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: updateItinerarySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Itinerary updated successfully",
      content: {
        "application/json": {
          schema: itineraryResponseSchema,
        },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    404: errorResponse(notFoundErrorSchema, "Itinerary not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Delete Itinerary
registerRoute({
  method: "delete",
  path: "/api/admin/itinerary/{itineraryId}",
  summary: "Delete an itinerary",
  tags: ["Itineraries"],
  security: [{ bearerAuth: [] }],
  request: {
    params: itineraryIdParamSchema,
  },
  responses: {
    200: {
      description: "Itinerary deleted successfully",
      content: {
        "application/json": {
          schema: z.object({
            message: z
              .string()
              .openapi({ example: "Itinerary deleted successfully" }),
          }),
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    404: errorResponse(notFoundErrorSchema, "Itinerary not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Add activity
registerRoute({
  method: "post",
  path: "/api/admin/itinerary/{itineraryId}/add-activities",
  summary: "Add activities to an itinerary",
  description: "Add one or more activities to an existing itinerary",
  tags: ["Itineraries"],
  security: [{ bearerAuth: [] }],
  request: {
    params: itineraryIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: activityOperationResponseSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Activities added successfully",
      content: {
        "application/json": {
          schema: itineraryResponseSchema,
        },
      },
    },
    400: errorResponse(
      badRequestErrorSchema,
      "Bad Request - Invalid activity data"
    ),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    404: errorResponse(notFoundErrorSchema, "Itinerary not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Remove Activities from Itinerary
registerRoute({
  method: "delete",
  path: "/api/admin/itinerary/{itineraryId}/remove-activities",
  summary: "Remove activities from an itinerary",
  description:
    "Remove one or more activities from an itinerary by their indexes",
  tags: ["Itineraries"],
  security: [{ bearerAuth: [] }],
  request: {
    params: itineraryIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: removeActivitiesSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Activities removed successfully",
      content: {
        "application/json": {
          schema: activityOperationResponseSchema,
        },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request - Invalid indexes"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    404: errorResponse(
      notFoundErrorSchema,
      "Itinerary or activities not found"
    ),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

export default router;
