import {
  DiscountSource,
  DiscountValueType,
  RentalStatus,
  TourType,
  UserRole,
} from "@prisma/client";
import z from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { paginatedResponse } from "./common.schema";

extendZodWithOpenApi(z);

const today = new Date();
today.setHours(0, 0, 0, 0);

const AppliedDiscountSchema = z.object({
  source: z.nativeEnum(DiscountSource),
  valueType: z.nativeEnum(DiscountValueType),
  value: z.number(),
  amount: z.number(),
  code: z.string().optional(),
});

const CreateVehicleBookingSchema = z
  .object({
    vehicleId: z.string().min(1, "Vehicle ID is required"),

    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Start date must be in YYYY-MM-DD format",
    }),

    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "End date must be in YYYY-MM-DD format",
    }),

    numberOfVehicles: z.number().int().min(1),

    destination: z.string().optional(),
    pickupLocation: z.string().optional(),
    dropoffLocation: z.string().optional(),
    tourType: z.nativeEnum(TourType).optional(),

    needsDriver: z.boolean().default(false),
    numberOfDrivers: z.number().int().min(0).default(0),

    couponCode: z.string().optional(),

    advanceAmount: z.number().min(0).default(0),

    specialRequests: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.needsDriver ||
      (data.numberOfDrivers !== undefined && data.numberOfDrivers > 0),
    {
      message: "Number of drivers must be specified when driver is needed",
      path: ["numberOfDrivers"],
    },
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      return start >= today;
    },
    {
      message: "Start date cannot be in the past",
      path: ["startDate"],
    },
  )
  .refine(
    (data) => {
      const end = new Date(data.endDate);
      return end >= today;
    },
    {
      message: "End date cannot be in the past",
      path: ["endDate"],
    },
  )
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

const UpdateVehicleBookingSchema = CreateVehicleBookingSchema.omit({
  vehicleId: true,
}).partial();

const CancelBookingSchema = z.object({
  cancellationReason: z.string().min(1),
  cancelledBy: z.nativeEnum(UserRole),
});

const GetBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  status: z.nativeEnum(RentalStatus).optional(),
  tourType: z.nativeEnum(TourType).optional(),

  vehicleId: z.string().optional(),
  userId: z.string().optional(),

  startDateFrom: z.coerce.date().optional(),
  startDateTo: z.coerce.date().optional(),

  search: z.string().optional(),

  sortBy: z
    .enum(["bookingDate", "startDate", "totalPrice"])
    .default("bookingDate"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const BookingIdParamSchema = z.object({
  bookingId: z.string().min(1),
});

const VehicleBookingResponseSchema = z.object({
  id: z.string(),
  bookingCode: z.string(),

  userId: z.string(),
  vehicleId: z.string(),

  startDate: z.date(),
  endDate: z.date(),
  durationDays: z.number(),
  numberOfVehicles: z.number(),

  destination: z.string().nullable(),
  pickupLocation: z.string().nullable(),
  dropoffLocation: z.string().nullable(),
  estimatedDistance: z.number().nullable(),
  tourType: z.nativeEnum(TourType).nullable(),

  pricePerDayAtBooking: z.number(),
  vehicleBaseAmount: z.number(),

  needsDriver: z.boolean(),
  numberOfDrivers: z.number(),
  baseDriverRate: z.number().nullable(),
  distanceCharge: z.number(),
  terrainCharge: z.number(),
  driverTotalAmount: z.number().nullable(),

  fuelCharge: z.number(),
  tollCharge: z.number(),
  otherCharges: z.number(),

  appliedDiscounts: z.array(AppliedDiscountSchema),
  discountAmount: z.number(),
  couponCode: z.string().nullable(),

  grossAmount: z.number(),
  totalPrice: z.number(),
  advanceAmount: z.number(),
  remainingAmount: z.number(),

  cancelledAt: z.date().nullable(),
  cancellationReason: z.string().nullable(),
  cancelledBy: z.string().nullable(),
  refundAmount: z.number(),

  specialRequests: z.string().nullable(),
  status: z.nativeEnum(RentalStatus),

  bookingDate: z.date(),
  completedAt: z.date().nullable(),
  updatedAt: z.date(),
});

const vehicleBookingListResponseSchema = paginatedResponse(
  VehicleBookingResponseSchema,
);

export {
  AppliedDiscountSchema,
  CreateVehicleBookingSchema,
  UpdateVehicleBookingSchema,
  CancelBookingSchema,
  GetBookingsQuerySchema,
  BookingIdParamSchema,
  VehicleBookingResponseSchema,
  vehicleBookingListResponseSchema,
};
