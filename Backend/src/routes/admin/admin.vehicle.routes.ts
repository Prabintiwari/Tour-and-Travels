import { Router } from "express";
import { createVehicle } from "../../controllers/vehicle.controller";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
import { registerRoute } from "../../utils/openapi.utils";
import { createVehicleSchema, vehicleResponseSchema } from "../../schema/vehicle.schema";
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

// Admin Vehicle routes

router.post("/", createVehicle);

// Swagger registration
// Create a new Vehicle
registerRoute({
  method: "post",
  path: "/api/admin/vehicle",
  summary: "Create a new vehicle",
  tags: ["Vehicle"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: createVehicleSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Vehicle created",
      content: {
        "application/json": { schema: vehicleResponseSchema },
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
