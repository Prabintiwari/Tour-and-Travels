import { Router } from "express";
import {  getFAQById,  searchFAQs } from "../../controllers/tourFAQ.controller";
import { registerRoute } from "../../utils/openapi.utils";
import { searchVehicleFAQSQuerySchema, tourFAQIdParamsSchema, tourFAQsListResponseSchema, tourParamsSchema, vehicleFAQsListResponseSchema, vehicleParamsSchema } from "../../schema";
import {
  badRequestErrorSchema,
  conflictErrorSchema,
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";
import { getVehicleFAQById, getVehicleFAQs } from "../../controllers/vehicleFAQ.controller";

const router = Router();

router.get("/search", searchFAQs);

router.get("/vehicles/:vehicleId", getVehicleFAQs);

router.get("/:faqId", getVehicleFAQById);

// Swagger registration


// Search vehicle faqs
registerRoute({
  method: "get",
  path: "/api/vehicle-faqs/search",
  summary: "Search all active FAQs for a vehicle",
  tags: ["Vehicle FAQS"],
  request: { query: searchVehicleFAQSQuerySchema },
  responses: {
    200: {
      description: "Search all active FAQs for a vehicle",
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

// Get tour faqs by vehicleId
registerRoute({
  method: "get",
  path: "/api/vehicle-faqs/vehicles/{vehicleId}",
  summary: "Get all active FAQs for a vehicle",
  tags: ["Vehicle FAQS"],
  request: { params: vehicleParamsSchema },
  responses: {
    200: {
      description: "Get all active FAQs for a vehicle",
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

// Get faqs by Id
registerRoute({
  method: "get",
  path: "/api/vehicle-faqs/{faqId}",
  summary: "Get active FAQs by Id",
  tags: ["Vehicle FAQS"],
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
