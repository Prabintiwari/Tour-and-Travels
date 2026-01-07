import { Router } from "express";
import {
  createDestination,
  deleteDestination,
  updateDestination,
} from "../../controllers/destination.controller";
import {
  destinationIdParamSchema,
  destinationResponseSchema,
  destinationSchema,
  updateDestinationSchema,
} from "../../schema";
import { cloudinaryUpload } from "../../middleware/upload";
import { validate } from "../../middleware/validate";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
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

router.use(authenticateToken, AdminOnly);
// Admin destination routes
router.post(
  "/",
  cloudinaryUpload("destination/").array("imageUrl", 5),
  validate.body(destinationSchema),
  createDestination
);

router.patch(
  "/:destinationId",
  cloudinaryUpload("destination/").array("imageUrl", 5),
  validate.params(destinationIdParamSchema),
  validate.body(updateDestinationSchema),
  updateDestination
);

router.delete(
  "/:destinationId",
  validate.params(destinationIdParamSchema),
  deleteDestination
);

// Swagger registration

// Create a new destination
registerRoute({
  method: "post",
  path: "/api/admin/destinations",
  summary: "Create a new destination",
  tags: ["Destinations"],
  request: {
    body: {
      content: {
        "application/json": { schema: destinationSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Destination created",
      content: {
        "application/json": { schema: destinationResponseSchema },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Update a destination
registerRoute({
  method: "patch",
  path: "/api/admin/destinations/{destinationId}",
  summary: "Update destination",
  tags: ["Destinations"],
  request: {
    body: {
      content: {
        "application/json": { schema: updateDestinationSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Tour updated",
      content: {
        "application/json": { schema: destinationResponseSchema },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Delete a destination
registerRoute({
  method: "delete",
  path: "/api/admin/destinations/{destinationId}",
  summary: "Delete destination",
  tags: ["Destinations"],
  request: {
    params: destinationIdParamSchema,
  },
  responses: {
    200: {
      description: "Tour deleted",
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

export default router;
