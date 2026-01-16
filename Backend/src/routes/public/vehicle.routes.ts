import { Router } from "express";
import { getVehicleById } from "../../controllers/vehicle.controller";
import { registerRoute } from "../../utils/openapi.utils";
import {
  vehicleParamsSchema,
  vehicleResponseSchema,
} from "../../schema/vehicle.schema";
import {
  badRequestErrorSchema,
  conflictErrorSchema,
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";

const router = Router();

// Vehicle routes

router.get("/:vehicleId", getVehicleById);

// Swagger registration

// Get vehicle by id
registerRoute({
  method: "get",
  path: "/api/vehicle/{vehicleId}",
  summary: "Get a vehicle by Id",
  tags: ["Vehicle"],
  request: {
    params: vehicleParamsSchema,
  },
  responses: {
    200: {
      description: "Get a vehicle by Id",
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
