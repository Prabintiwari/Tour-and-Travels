import { Router } from "express";
import {
  allFAQSQuerySchema,
  createTourFAQSchema,
  tourFAQIdParamsSchema,
  tourFAQResponseSchema,
  tourFAQsListResponseSchema,
  tourFAQSQuerySchema,
  tourParamsSchema,
  updateTourFAQSchema,
} from "../../schema";
import {
  createFAQ,
  deleteFAQ,
  getAdminFAQById,
  getAllFAQs,
  getAllTourFAQs,
  getFAQById,
  toggleFAQStatus,
  updateFAQ,
} from "../../controllers/tourFAQ.controller";
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

// Admin FAQ routes

router.post("/", createFAQ);

router.get("/tours/:tourId", getAllTourFAQs);

router.patch("/:faqId/toggle",  toggleFAQStatus);

router.patch("/:faqId",  updateFAQ);

router.delete("/:faqId",  deleteFAQ);

router.get("/",  getAllFAQs);

router.get("/:faqId",  getAdminFAQById);


// Swagger registration

// Create a new tour faqs
registerRoute({
  method: "post",
  path: "/api/admin/faqs",
  summary: "Create a new tour faqs",
  tags: ["FAQS"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: createTourFAQSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Tour Faqs created",
      content: {
        "application/json": { schema: tourFAQResponseSchema },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Update a new tour faqs
registerRoute({
  method: "patch",
  path: "/api/admin/faqs/{faqId}",
  summary: "Update a  tour faqs",
  tags: ["FAQS"],
  security: [{ bearerAuth: [] }],
  request: {
    params:tourFAQIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: updateTourFAQSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Tour Faqs updated",
      content: {
        "application/json": { schema: tourFAQResponseSchema },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Toggle FAQ active status
registerRoute({
  method: "patch",
  path: "/api/admin/faqs/{faqId}/toggle",
  summary: "Toggle FAQ active status",
  tags: ["FAQS"],
  security: [{ bearerAuth: [] }],
  request: {
    params:tourFAQIdParamsSchema,
  },
  responses: {
    200: {
      description: "Toggle FAQ active status",
      content: {
        "application/json": { schema: tourFAQResponseSchema },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get all faqs
registerRoute({
  method: "get",
  path: "/api/admin/faqs",
  summary: "Get all FAQs across all tours",
  tags: ["FAQS"],
  security: [{ bearerAuth: [] }],
  request: { query: allFAQSQuerySchema },
  responses: {
    200: {
      description: "Get all FAQs across all tours",
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

// Get all faqs for a tour
registerRoute({
  method: "get",
  path: "/api/admin/faqs/tours/{tourId}",
  summary: "Get all Faqs for a tour (including inactive)",
  tags: ["FAQS"],
  security: [{ bearerAuth: [] }],
  request: { params: tourParamsSchema, query: tourFAQSQuerySchema },
  responses: {
    200: {
      description: "Get all Faqs for a tour",
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

//Get FAQ by ID (including inactive)
registerRoute({
  method: "get",
  path: "/api/admin/faqs/{faqId}",
  summary: "Get FAQ by ID (including inactive)",
  tags: ["FAQS"],
  security: [{ bearerAuth: [] }],
  request: { params: tourFAQIdParamsSchema },
  responses: {
    200: {
      description: "Get FAQ by ID",
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

// Delete an FAQ
registerRoute({
  method: "delete",
  path: "/api/admin/faqs/{faqId}",
  summary: "Delete a faqs",
  tags: ["FAQS"],
  security: [{ bearerAuth: [] }],
  request: {
    params:tourFAQIdParamsSchema,
  },
  responses: {
    200: {
      description: "Tour Faqs deleted successfully",
     
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

export default router;
