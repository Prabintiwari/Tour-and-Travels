import { Router } from "express";
import { getAllFAQs } from "../../controllers/tourFAQ.controller";
import { registerRoute } from "../../utils/openapi.utils";
import { tourFAQsListResponseSchema } from "../../schema";
import { badRequestErrorSchema, conflictErrorSchema, errorResponse, forbiddenErrorSchema, internalServerErrorSchema, unauthorizedErrorSchema } from "../../schema/common.schema";

const router = Router()

router.get("/",getAllFAQs)


// Swagger registration

// Get all faqs
registerRoute({
  method: "get",
  path: "/api/Faqs",
  summary: "Get all Tour Faqs",
  tags: ["FAQS"],
  responses: {
    200: {
      description: "Get all Tour Faqs",
      content: {
        "application/json": { schema: tourFAQsListResponseSchema },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

export default router