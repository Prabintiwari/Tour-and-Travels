import { Router } from "express";
import {
  addVehicleImages,
  createVehicle,
  deleteVehicle,
  getAllVehiclesAdmin,
  getVehicleByIdAdmin,
  updateVehicle,
} from "../../controllers/vehicle.controller";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
import { registerRoute } from "../../utils/openapi.utils";
import {
  adminVehicleQuerySchema,
  createVehicleSchema,
  updateVehicleSchema,
  vehicleListResponseSchema,
  vehicleParamsSchema,
  vehicleResponseSchema,
} from "../../schema/vehicle.schema";
import {
  badRequestErrorSchema,
  conflictErrorSchema,
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";
import { cloudinaryUploadFromParams } from "../../middleware/upload";
import z from "zod";

const router = Router();

router.use(authenticateToken, AdminOnly);

// Admin Vehicle routes

router.post("/", createVehicle);

router.post(
  "/:vehicleId/images",
  cloudinaryUploadFromParams("vehicles/images", "vehicleId").array(
    "images",
    10
  ),
  addVehicleImages
);

router.get("/", getAllVehiclesAdmin);

router.get("/:vehicleId", getVehicleByIdAdmin);

router.patch("/:vehicleId", updateVehicle);

router.delete("/:vehicleId", deleteVehicle);

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
    201: {
      description: "Vehicle Created",
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

// Upload images for a vehicle
registerRoute({
  method: "post",
  path: "/api/admin/vehicle/{vehicleId}/images",
  summary: "Upload images for a vehicle",
  tags: ["Vehicle"],
  security: [{ bearerAuth: [] }],
  request: {
    params: vehicleParamsSchema,
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              imageUrl: {
                type: "array",
                items: {
                  type: "string",
                  format: "binary",
                },
              },
            },
            required: ["imageUrl"],
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Images uploaded successfully",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },

    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    404: errorResponse(notFoundErrorSchema, "Vehicle not found"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get all Vehicles
registerRoute({
  method: "get",
  path: "/api/admin/vehicle",
  summary: "Get all Vehicles by Admin ",
  tags: ["Vehicle"],
  security: [{ bearerAuth: [] }],
  request: {
    query: adminVehicleQuerySchema,
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

// Get vehicle by id
registerRoute({
  method: "get",
  path: "/api/admin/vehicle/{vehicleId}",
  summary: "Get a vehicle by Id by Admin",
  tags: ["Vehicle"],
  security: [{ bearerAuth: [] }],
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

// Update a  Vehicle
registerRoute({
  method: "patch",
  path: "/api/admin/vehicle/{vehicleId}",
  summary: "Update a vehicle",
  tags: ["Vehicle"],
  security: [{ bearerAuth: [] }],
  request: {
    params: vehicleParamsSchema,
    body: {
      content: {
        "application/json": { schema: updateVehicleSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Vehicle Updated",
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

// Delete or Deactivate a  Vehicle
registerRoute({
  method: "delete",
  path: "/api/admin/vehicle/{vehicleId}",
  summary: "Deactivate a vehicle",
  tags: ["Vehicle"],
  security: [{ bearerAuth: [] }],
  request: {
    params: vehicleParamsSchema,
  },
  responses: {
    200: {
      description: "Vehicle Deactivated",
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
