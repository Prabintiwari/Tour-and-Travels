import { Router } from "express";
import {
  getAvailableSchedules,
  getTourScheduleById,
  getTourSchedules,
} from "../../controllers/tourSchedule.controller";
import {
  tourParamsSchema,
  tourScheduleIdParamSchema,
  tourScheduleListResponseSchema,
  tourScheduleQuerySchema,
} from "../../schema";
import { registerRoute } from "../../utils/openapi.utils";
import { errorResponse, forbiddenErrorSchema, internalServerErrorSchema, notFoundErrorSchema, unauthorizedErrorSchema } from "../../schema/common.schema";
import { validateParams, validateQuery } from "../../middleware/validate";
const router = Router();

router.get("/", validateQuery(tourScheduleQuerySchema), getTourSchedules);
router.get(
  "/available/:tourId",
  validateParams(tourParamsSchema),
  getAvailableSchedules
);
router.get(
  "/:tourScheduleId",
  validateParams(tourScheduleIdParamSchema),
  getTourScheduleById
);

// Swagger registration

// Get all tour schedule
registerRoute({
  method: "get",
  path: "/api/tour-schedule",
  summary: "List of Tour Schedule",
  tags: ["Tour Schedule"],
  request: {
    query: tourScheduleQuerySchema,
  },
  responses: {
    200: {
      description: "List of Tour Schedule",
      content: {
        "application/json": {
          schema: tourScheduleListResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),

    403: errorResponse(forbiddenErrorSchema, "Forbidden"),

    404: errorResponse(notFoundErrorSchema, "Tour Schedule Not Found"),

    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get available tour schedule by tourId
registerRoute({
  method: "get",
  path: "/api/tour-schedule/available/{tourId}",
  summary: "List of Tour Schedule by tourId",
  tags: ["Tour Schedule"],
  request: {
    query: tourParamsSchema,
  },
  responses: {
    200: {
      description: "List of Tour Schedule by tourId",
      content: {
        "application/json": {
          schema: tourScheduleListResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),

    403: errorResponse(forbiddenErrorSchema, "Forbidden"),

    404: errorResponse(notFoundErrorSchema, "Tour Schedule Not Found"),

    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get tour schedule by schedule id
registerRoute({
  method: "get",
  path: "/api/tour-schedule/{tourScheduleId}",
  summary: "Get Tour Schedule by schdeule id",
  tags: ["Tour Schedule"],
  request: {
    query: tourScheduleQuerySchema,
  },
  responses: {
    200: {
      description: "Get Tour Schedule by schdeule id",
      content: {
        "application/json": {
          schema: tourScheduleListResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),

    403: errorResponse(forbiddenErrorSchema, "Forbidden"),

    404: errorResponse(notFoundErrorSchema, "Tour Schedule Not Found"),

    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

export default router;
