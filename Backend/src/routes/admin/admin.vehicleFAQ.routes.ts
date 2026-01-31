import { Router } from "express";
import {
  allFAQSQuerySchema,
  allVehicleFAQSQuerySchema,
  bulkCreateVehicleFAQsSchema,
  bulkDeleteFAQsSchema,
  bulkUpdateTourFAQsSchema,
  copyFAQsParamsSchema,
  copyFAQsSchema,
  createVehicleFAQSchema,
  FAQsStatisticsQuerySchema,
  tourFAQIdParamsSchema,
  tourFAQResponseSchema,
  tourFAQsListResponseSchema,
  updateTourFAQSchema,
  updateVehicleFAQSchema,
  vehicleFAQIdParamsSchema,
  vehicleFAQResponseSchema,
  vehicleFAQsListResponseSchema,
  vehicleFAQSQuerySchema,
  vehicleParamsSchema,
} from "../../schema";
import {
  bulkCreateFAQs,
  bulkDeleteFAQs,
  bulkUpdateFAQs,
  copyFAQs,
  deleteFAQ,
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
import { createVehicleFAQ, getAdminVehicleFAQById, getAllFAQs, getAllVehicleFAQs } from "../../controllers/vehicleFAQ.controller";

const router = Router();
router.use(authenticateToken, AdminOnly);

// Admin FAQ routes

router.post("/", createVehicleFAQ);

router.post("/tour/:tourId/bulk-create", bulkCreateFAQs);

router.patch("/bulk-update", bulkUpdateFAQs);

router.patch("/:faqId/toggle", toggleFAQStatus);

router.patch("/:faqId", updateFAQ);

router.get("/vehicles/:vehicleId", getAllVehicleFAQs);

router.post("/tours/:sourceTourId/copy/:targetTourId", copyFAQs);

router.get("/statistics", getFAQStatistics);

router.get("/", getAllFAQs);

router.delete("/bulk-delete", bulkDeleteFAQs);

router.get("/:faqId", getAdminVehicleFAQById);

router.delete("/:faqId", deleteFAQ);

// Swagger registration

// Create a new vehicle faqs
registerRoute({
  method: "post",
  path: "/api/admin/vehicle-faqs",
  summary: "Create a new vehicle faqs",
  tags: ["Vehicle FAQS"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: createVehicleFAQSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Vehicle Faqs created",
      content: {
        "application/json": { schema: vehicleFAQResponseSchema },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Bulk create FAQs for a vehicle
registerRoute({
  method: "post",
  path: "/api/admin/faqs/vehicle/{vehicleId}/bulk-create",
  summary: "Bulk create FAQs for a vehicle ",
  tags: ["Vehicle FAQS"],
  security: [{ bearerAuth: [] }],
  request: {
    params: vehicleParamsSchema,
    body: {
      content: {
        "application/json": { schema: bulkCreateVehicleFAQsSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Bulk FAQs for a vehicle created",
      content: {
        "application/json": { schema: vehicleFAQResponseSchema },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Update a vehicle faqs
registerRoute({
  method: "patch",
  path: "/api/admin/vehicle-faqs/{faqId}",
  summary: "Update a  vehicle faqs",
  tags: ["Vehicle FAQS"],
  security: [{ bearerAuth: [] }],
  request: {
    params: vehicleFAQIdParamsSchema,
    body: {
      content: {
        "application/json": { schema: updateVehicleFAQSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Vehicle Faqs updated",
      content: {
        "application/json": { schema: vehicleFAQResponseSchema },
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
  tags: ["Vehicle FAQS"],
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
  tags: ["Vehicle FAQS"],
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
  tags: ["Vehicle FAQS"],
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
  path: "/api/admin/vehicle-faqs",
  summary: "Get all FAQs across all vehicles",
  tags: ["Vehicle FAQS"],
  security: [{ bearerAuth: [] }],
  request: { query: allVehicleFAQSQuerySchema },
  responses: {
    200: {
      description: "Get all FAQs across all vehicles",
      content: {
        "application/json": { schema: vehicleFAQsListResponseSchema },
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
  tags: ["Vehicle FAQS"],
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

// Get all faqs for a vehicle (including inactive)
registerRoute({
  method: "get",
  path: "/api/admin/vehicle-faqs/vehicles/{vehicleId}",
  summary: "Get all Faqs for a vehicle (including inactive)",
  tags: ["Vehicle FAQS"],
  security: [{ bearerAuth: [] }],
  request: { params: vehicleParamsSchema, query: vehicleFAQSQuerySchema },
  responses: {
    200: {
      description: "Get all Faqs for a vehicle",
      content: {
        "application/json": { schema: vehicleFAQsListResponseSchema },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get FAQ by ID (including inactive)
registerRoute({
  method: "get",
  path: "/api/admin/vehicle-faqs/{faqId}",
  summary: "Get FAQ by ID (including inactive)",
  tags: ["Vehicle FAQS"],
  security: [{ bearerAuth: [] }],
  request: { params: vehicleFAQIdParamsSchema },
  responses: {
    200: {
      description: "Get FAQ by ID",
      content: {
        "application/json": { schema: vehicleFAQResponseSchema },
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
  tags: ["Vehicle FAQS"],
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
  tags: ["Vehicle FAQS"],
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
