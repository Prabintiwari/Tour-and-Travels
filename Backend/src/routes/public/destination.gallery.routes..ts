import { Router } from "express";
import {
  getAllGalleries,
  getGalleryByDestination,
} from "../../controllers/destinationGallery.controller";
import { registerRoute } from "../../utils/openapi.utils";
import { destinationGalleryResponseSchema, destinationIdParamSchema } from "../../schema";
import { errorResponse, forbiddenErrorSchema, internalServerErrorSchema, notFoundErrorSchema, unauthorizedErrorSchema } from "../../schema/common.schema";
import { validateParams } from "../../middleware/validate";

const router = Router();


// Destination routes
router.get("/", getAllGalleries);

router.get("/:destinationId",validateParams(destinationIdParamSchema), getGalleryByDestination);

// Swagger registration

// Get all gallery
registerRoute({
  method: "get",
  path: "/api/destination-gallery",
  summary: "List of Destinations gallery",
  tags: ["Destinations"],
  request: {
    query: destinationIdParamSchema,
  },
  responses: {
    200: {
      description: "List of destination-gallery",
      content: {
        "application/json": {
          schema: destinationGalleryResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),

    403: errorResponse(forbiddenErrorSchema, "Forbidden"),

    404: errorResponse(notFoundErrorSchema, "Not Found"),

    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get gallery by destination Id
registerRoute({
  method: "get",
  path: "/api/destination-gallery/{destinationId}",
  summary: "List of Destinations gallery by id",
  tags: ["Destinations"],
  request: {
    query: destinationIdParamSchema,
  },
  responses: {
    200: {
      description: "List of destination-gallery by id",
      content: {
        "application/json": {
          schema: destinationGalleryResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),

    403: errorResponse(forbiddenErrorSchema, "Forbidden"),

    404: errorResponse(notFoundErrorSchema, "Not Found"),

    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});
export default router;
