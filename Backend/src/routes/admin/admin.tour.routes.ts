import { Router } from "express";
import {
  addTourImages,
  createTour,
  deleteTour,
  deleteTourGuidePricing,
  removeTourImages,
  setDefaultGuidePricing,
  updateTour,
} from "../../controllers/tour.controller";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
import { registerRoute } from "../../utils/openapi.utils";
import {
  createTourSchema,
  defaultGuidePricingResponseSchema,
  defaultGuidePricingSchema,
  removeTourImagesBodySchema,
  tourParamsSchema,
  tourResponseSchema,
  updateTourSchema,
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
import { validate } from "../../middleware/validate";
import z from "zod";
import { cloudinaryUploadFromParams } from "../../middleware/upload";
const router = Router();

router.use(authenticateToken, AdminOnly);

registerRoute({
  method: "post",
  path: "/api/admin/tour/guide-pricing/default",
  summary: "Set default guide pricing",
  tags: ["Tours"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: defaultGuidePricingSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Default guide pricing saved",
      content: {
        "application/json": {
          schema: defaultGuidePricingResponseSchema,
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
router.post(
  "/guide-pricing/default",
  validate(defaultGuidePricingSchema),
  setDefaultGuidePricing
);

registerRoute({
  method: "post",
  path: "/api/admin/tour",
  summary: "Create a new tour",
  tags: ["Tours"],
  request: {
    body: {
      content: {
        "application/json": { schema: createTourSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Tour created",
      content: {
        "application/json": { schema: tourResponseSchema },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});
router.post("/", validate(createTourSchema), createTour);

registerRoute({
  method: "post",
  path: "/api/admin/tour/:tourId",
  summary: "Upload images for a tour",
  tags: ["Tours"],
  request: {
    params: tourParamsSchema,
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              imageUrl: {
                type: "array",
                items: {
                  type: "string",
                  format: "binary",
                },
              },
            },
            required: ["imageUrl"],
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Images uploaded successfully",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },

    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    404: errorResponse(notFoundErrorSchema, "Tour not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});
router.post(
  "/:tourId",
  validate(tourParamsSchema),
  cloudinaryUploadFromParams("tour", "tourId").array("imageUrl", 10),
  addTourImages
);

registerRoute({
  method: "patch",
  path: "/api/admin/tour/:tourId/images",
  summary: "Remove tour images",
  tags: ["Tours"],
  request: {
    params: tourParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: removeTourImagesBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Tour images removed successfully",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({
              example: "Images removed successfully",
            }),
          }),
        },
      },
    },

    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    404: errorResponse(notFoundErrorSchema, "Tour not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});
router.patch("/:tourId/images", validate(tourParamsSchema), removeTourImages);

registerRoute({
  method: "patch",
  path: "/api/admin/tour/:tourId",
  summary: "Update tour",
  tags: ["Tours"],
  request: {
    body: {
      content: {
        "application/json": { schema: updateTourSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Tour updated",
      content: {
        "application/json": { schema: tourResponseSchema },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});
router.patch(
  "/:tourId",
  validate(tourParamsSchema),
  validate(updateTourSchema),
  updateTour
);

registerRoute({
  method: "delete",
  path: "/api/admin/tour/:tourId/guide-pricing",
  summary: "Delete tour guide pricing",
  tags: ["Tours"],
  request: {
    params: tourParamsSchema,
  },
  responses: {
    200: {
      description: "Tour guide pricing deleted",
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});
router.delete(
  "/:tourId/guide-pricing",
  validate(tourParamsSchema),
  deleteTourGuidePricing
);

registerRoute({
  method: "delete",
  path: "/api/admin/tour/:tourId",
  summary: "Delete tour",
  tags: ["Tours"],
  request: {
    params: tourParamsSchema,
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
router.delete("/:tourId", validate(tourParamsSchema), deleteTour);

export default router;
