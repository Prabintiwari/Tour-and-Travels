import { Router } from "express";

import { validate } from "../../middleware/validate";

import {
  createTourScheduleSchema,
  tourScheduleIdParamSchema,
  tourScheduleResponseSchema,
  updateTourScheduleSchema,
} from "../../schema";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
import {
  createTourSchedule,
  deleteTourSchedule,
  updateTourSchedule,
} from "../../controllers/tourSchedule.controller";
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

// Tour Schedule API
router.post("/", validate.body(createTourScheduleSchema), createTourSchedule);
router.patch(
  "/:tourScheduleId",
  validate.params(tourScheduleIdParamSchema),
  validate.body(updateTourScheduleSchema),
  updateTourSchedule
);

router.delete(
  "/:tourScheduleId",
  validate.params(tourScheduleIdParamSchema),
  deleteTourSchedule
);

// Swagger Registration

// Create a new tour schedule
registerRoute({
  method: "post",
  path: "/api/admin/tour-schedule",
  summary: "Create a new tour schedule",
  tags: ["Tour Schedule"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: createTourScheduleSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Tour schedule created",
      content: {
        "application/json": { schema: tourScheduleResponseSchema },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Update a  tour schedule
registerRoute({
  method: "patch",
  path: "/api/admin/tour-schedule/{tourScheduleId}",
  summary: "Update a  tour schedule",
  tags: ["Tour Schedule"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: updateTourScheduleSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Tour schedule updated",
      content: {
        "application/json": { schema: tourScheduleResponseSchema },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Delete tour schedule
registerRoute({
  method: "delete",
  path: "/api/admin/tour-schedule/{tourScheduleId}",
  summary: "Delete tour",
  tags: ["Tour Schedule"],
  security: [{ bearerAuth: [] }],
  request: {
    params: tourScheduleIdParamSchema,
  },
  responses: {
    200: {
      description: "Tour schedule deleted",
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

export default router;
