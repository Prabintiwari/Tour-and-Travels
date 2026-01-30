import { Router } from "express";
import {  getFAQById, getTourFAQs, searchFAQs } from "../../controllers/tourFAQ.controller";
import { registerRoute } from "../../utils/openapi.utils";
import { tourFAQIdParamsSchema, tourFAQsListResponseSchema, tourParamsSchema } from "../../schema";
import {
  badRequestErrorSchema,
  conflictErrorSchema,
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";

const router = Router();

router.get("/search", searchFAQs);

router.get("/tours/:tourId", getTourFAQs);

router.get("/:faqId", getFAQById);

// Swagger registration

// Get tour faqs by tourId
registerRoute({
  method: "get",
  path: "/api/faqs/tours/{tourId}",
  summary: "Get all active FAQs for a tour",
  tags: ["FAQS"],
  request: { params: tourParamsSchema },
  responses: {
    200: {
      description: "Get all active FAQs for a tour",
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

// Get faqs by Id
registerRoute({
  method: "get",
  path: "/api/faqs/{faqId}",
  summary: "Get active FAQs by Id",
  tags: ["FAQS"],
  request: { params: tourFAQIdParamsSchema },
  responses: {
    200: {
      description: "Get active FAQs by Id",
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

export default router;
