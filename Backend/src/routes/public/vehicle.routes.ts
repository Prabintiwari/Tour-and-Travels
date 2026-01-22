import { Router } from "express";
import {
  getAvailableVehicles,
  getVehicleByIdPubic,
  searchVehicles,
} from "../../controllers/vehicle.controller";
import { registerRoute } from "../../utils/openapi.utils";
import {
  publicVehicleQuerySchema,
  searchVehicleSchema,
  vehicleListResponseSchema,
  vehicleParamsSchema,
  vehicleResponseSchema,
} from "../../schema";
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

router.get("/", getAvailableVehicles);

router.post("/search", searchVehicles);

router.get("/:vehicleId", getVehicleByIdPubic);

// Swagger registration

// Get all Vehicles - (Public)
registerRoute({
  method: "get",
  path: "/api/vehicle",
  summary: "Get all Vehicles",
  tags: ["Vehicle"],
  request: {
    query: publicVehicleQuerySchema,
  },
  responses: {
    200: {
      description: "Get all Vehicles",
      content: {
        "application/json": { schema: vehicleListResponseSchema },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Search Vehicles - (Public)
registerRoute({
  method: "post",
  path: "/api/vehicle/search",
  summary: "Search Vehicles",
  tags: ["Vehicle"],
  request: {
    body: {
      content: {
        "application/json": { schema: searchVehicleSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Search Vehicles",
      content: {
        "application/json": { schema: vehicleListResponseSchema },
      },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get vehicle by id - (Public)
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
