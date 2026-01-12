import { Router } from "express";
import {
  allFAQSQuerySchema,
  bulkCreateTourFAQsSchema,
  bulkDeleteFAQsSchema,
  bulkUpdateTourFAQsSchema,
  copyFAQsParamsSchema,
  copyFAQsSchema,
  createTourFAQSchema,
  FAQsStatisticsQuerySchema,
  tourFAQIdParamsSchema,
  tourFAQResponseSchema,
  tourFAQsListResponseSchema,
  tourFAQSQuerySchema,
  tourParamsSchema,
  updateTourFAQSchema,
} from "../../schema";
import {
  bulkCreateFAQs,
  bulkDeleteFAQs,
  bulkUpdateFAQs,
  copyFAQs,
  createFAQ,
  deleteFAQ,
  getAdminFAQById,
  getAllFAQs,
  getAllTourFAQs,
  getFAQStatistics,
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

router.post("/tour/:tourId/bulk-create", bulkCreateFAQs);

router.patch("/bulk-update", bulkUpdateFAQs);

router.patch("/:faqId/toggle", toggleFAQStatus);

router.patch("/:faqId", updateFAQ);

router.get("/tours/:tourId", getAllTourFAQs);

router.post("/tours/:sourceTourId/copy/:targetTourId", copyFAQs);

router.get("/statistics", getFAQStatistics);

router.get("/", getAllFAQs);

router.delete("/bulk-delete", bulkDeleteFAQs);

router.get("/:faqId", getAdminFAQById);

router.delete("/:faqId", deleteFAQ);

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

// Bulk create FAQs for a tour
registerRoute({
  method: "post",
  path: "/api/admin/faqs/tour/{tourId}/bulk-create",
  summary: "Bulk create FAQs for a tour ",
  tags: ["FAQS"],
  security: [{ bearerAuth: [] }],
  request: {
    params: tourParamsSchema,
    body: {
      content: {
        "application/json": { schema: bulkCreateTourFAQsSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Bulk FAQs for a tour created",
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
    params: tourFAQIdParamsSchema,
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

// Bulk update FAQs
registerRoute({
  method: "patch",
  path: "/api/admin/faqs/bulk-update",
  summary: "Bulk update FAQs ",
  tags: ["FAQS"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: bulkUpdateTourFAQsSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Bulk FAQs updated",
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

// Copy FAQs from one tour to another
registerRoute({
  method: "post",
  path: "/api/admin/faqs/tours/{sourceTourId}/copy/{targetTourId}",
  summary: "Copy FAQs from one tour to another",
  tags: ["FAQS"],
  security: [{ bearerAuth: [] }],
  request: {
    params: copyFAQsParamsSchema,
    body: {
      content: {
        "application/json": { schema: copyFAQsSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Faqs copy successfully",
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
    params: tourFAQIdParamsSchema,
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

// Get faqs statistics
registerRoute({
  method: "get",
  path: "/api/admin/faqs/statistics",
  summary: "Get FAQs statistics",
  tags: ["FAQS"],
  security: [{ bearerAuth: [] }],
  request: { query: FAQsStatisticsQuerySchema },
  responses: {
    200: {
      description: "Get FAQs statistics",
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
    params: tourFAQIdParamsSchema,
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

// Bulk delete FAQs
registerRoute({
  method: "delete",
  path: "/api/admin/faqs/bulk-delete",
  summary: "Bulk delete FAQs",
  tags: ["FAQS"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: bulkDeleteFAQsSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Bulk Faqs deleted successfully",
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

export default router;
