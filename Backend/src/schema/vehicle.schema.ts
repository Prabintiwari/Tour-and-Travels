import { FuelType, VehicleType, VehicleStatus } from "@prisma/client";
import z from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { paginatedResponse } from "./common.schema";

extendZodWithOpenApi(z);

const createVehicleSchema = z
  .object({
    vehicleType: z.nativeEnum(VehicleType),
    brand: z.string().min(1, "Brand is required"),
    model: z.string().optional(),
    year: z
      .number()
      .int()
      .min(1980)
      .max(new Date().getFullYear() + 1)
      .optional(),
    seatCapacity: z.number().int().positive().optional(),
    luggageCapacity: z.number().int().nonnegative().optional(),
    pricePerDay: z.number().positive("Price per day must be positive"),
    pricePerHour: z.number().positive().optional(),
    totalQuantity: z.number().int().positive("Total quantity must be positive"),
    fuelType: z.nativeEnum(FuelType).default(FuelType.PETROL),
    status: z.nativeEnum(VehicleStatus).default(VehicleStatus.AVAILABLE),
    city: z.string().min(1, "City is required"),
    region: z.string().optional(),
    features: z.array(z.string()).default([]),
    description: z.string().optional(),
  })
  .openapi("CreateVehicleRequest");

const updateVehicleSchema = createVehicleSchema
  .partial()
  .extend({
    availableQuantity: z
      .number()
      .int()
      .nonnegative("Available quantity cannot be negative")
      .optional(),
  })
  .refine(
    (data) => {
      if (
        data.totalQuantity !== undefined &&
        data.availableQuantity !== undefined
      ) {
        return data.availableQuantity <= data.totalQuantity;
      }
      return true;
    },
    {
      message: "Available quantity cannot exceed total quantity",
      path: ["availableQuantity"],
    }
  )
  .openapi("UpdateVehicleRequest");

const vehicleResponseSchema = z
  .object({
    id: z.string(),
    vehicleType: z.nativeEnum(VehicleType),
    brand: z.string(),
    model: z.string().nullable(),
    year: z.number().nullable(),
    seatCapacity: z.number().nullable(),
    luggageCapacity: z.number().nullable(),
    pricePerDay: z.number(),
    pricePerHour: z.number().nullable(),
    totalQuantity: z.number(),
    availableQuantity: z.number(),
    fuelType: z.nativeEnum(FuelType),
    status: z.nativeEnum(VehicleStatus),
    city: z.string(),
    region: z.string().nullable(),
    images: z.array(z.string()),
    imagePublicIds: z.array(z.string()),
    features: z.array(z.string()),
    description: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("VehicleResponse");

const vehicleListResponseSchema = paginatedResponse(vehicleResponseSchema);

const updateVehicleStatusSchema = z.object({
  status: z.nativeEnum(VehicleStatus),
});

const removeVehicleImagesBodySchema = z
  .object({
    imagePublicIds: z
      .array(z.string())
      .min(1, "At least one image publicId is required")
      .openapi({
        example: ["vehicle/abc123/img1", "vehicle/abc123/img2"],
      }),
  })
  .openapi("RemoveVehicleImagesBody");

const adminVehicleQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  vehicleType: z.nativeEnum(VehicleType).optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
  fuelType: z.nativeEnum(FuelType).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minSeatCapacity: z.coerce.number().int().positive().optional(),
  sortBy: z.string().optional().openapi({
    example: "startDate",
    description: "Sort by field",
  }),
  sortOrder: z.string().optional().default("asc").openapi({
    example: "asc",
    description: "Sort order",
  }),
  search: z.string().optional(),
});

const publicVehicleQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  vehicleType: z.nativeEnum(VehicleType).optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  fuelType: z.nativeEnum(FuelType).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minSeatCapacity: z.coerce.number().int().positive().optional(),
  sortBy: z.string().optional().openapi({
    example: "startDate",
    description: "Sort by field",
  }),
  sortOrder: z.string().optional().default("asc").openapi({
    example: "asc",
    description: "Sort order",
  }),
  search: z.string().optional(),
});

const vehicleParamsSchema = z.object({
  vehicleId: z
    .string()
    .min(1, "Vehicle ID is required")
    .openapi({ example: "vehicle_123abc" }),
});

export {
  createVehicleSchema,
  updateVehicleSchema,
  updateVehicleStatusSchema,
  vehicleResponseSchema,
  vehicleListResponseSchema,
  vehicleParamsSchema,
  adminVehicleQuerySchema,
  publicVehicleQuerySchema,
  removeVehicleImagesBodySchema,
};
