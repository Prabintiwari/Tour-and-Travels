import { Router } from "express";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
import { cloudinaryUploadFromParams } from "../../middleware/upload";
import {
  createOrUpdateGallery,
  deleteGallery,
  removeGalleryImages,
} from "../../controllers/destinationGallery.controller";
import { registerRoute } from "../../utils/openapi.utils";
import {
  createOrUpdateGalleryRequestSchema,
  destinationGalleryResponseSchema,
  destinationIdParamSchema,
  removeGalleryImagesSchema,
} from "../../schema";
import {
  badRequestErrorSchema,
  conflictErrorSchema,
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";
import { Param } from "@prisma/client/runtime/library";
import { validateParams } from "../../middleware/validate";

const router = Router();
router.use(authenticateToken, AdminOnly);

// Admin destinaion-gallery routes
router.post(
  "/:destinationId",
  cloudinaryUploadFromParams("destination/gallery", "destinationId").array(
    "imageUrl",
    10
  ),
  createOrUpdateGallery
);

router.patch(
  "/:destinationId/images",
  removeGalleryImages
);

router.delete(
  "/:destinationId",
  deleteGallery
);

// Swagger registration

// create or update a destination gallery
registerRoute({
  method: "post",
  path: "/api/admin/destination-gallery/{destinationId}",
  summary: "Create or update destination gallery",
  tags: ["Destinations"],
  security: [{ bearerAuth: [] }],
  request: {
    Params: destinationIdParamSchema,
    body: {
      content: {
        "multipart/form-data": {
          schema: createOrUpdateGalleryRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Gallery created or updated",
      content: {
        "application/json": {
          schema: destinationGalleryResponseSchema,
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

// Remove gallery images
registerRoute({
  method: "patch",
  path: "/api/admin/destination-gallery/{destinationId}/images",
  summary: "Remove images from destination gallery",
  tags: ["Destinations"],
  security: [{ bearerAuth: [] }],
  request: {
    params: destinationIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: removeGalleryImagesSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Images removed successfully",
      content: {
        "application/json": {
          schema: destinationGalleryResponseSchema,
        },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    404: errorResponse(notFoundErrorSchema, "Gallery or images not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Delete gallery
registerRoute({
  method: "delete",
  path: "/api/admin/destination-gallery/{destinationId}",
  summary: "Delete destination gallery by Id",
  tags: ["Destinations"],
  security: [{ bearerAuth: [] }],
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
