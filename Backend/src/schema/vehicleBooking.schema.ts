import { DiscountSource, DiscountValueType, TourType } from "@prisma/client";
import z from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { paginatedResponse } from "./common.schema";

extendZodWithOpenApi(z);

const AppliedDiscountSchema = z.object({
  source: z.nativeEnum(DiscountSource),
  valueType: z.nativeEnum(DiscountValueType),
  value: z.number(),
  amount: z.number(),
  code: z.string().optional(),
});

const CreateVehicleBookingSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  numberOfVehicles: z.number().int().min(1, "At least 1 vehicle required"),

  destination: z.string().optional(),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  estimatedDistance: z.number().optional(),
  tourType: z.nativeEnum(TourType).optional(),

  needsDriver: z.boolean().default(false),
  numberOfDrivers: z.number().int().min(0).default(0),

  fuelCharge: z.number().default(0),
  tollCharge: z.number().default(0),
  otherCharges: z.number().default(0),

  couponCode: z.string().optional(),

  advanceAmount: z.number().min(0).default(0),

  specialRequests: z.string().optional(),
});

export { AppliedDiscountSchema, CreateVehicleBookingSchema };
