import z from "zod";
import { BookingStatus, GuidePricingType } from "@prisma/client";
import { paginatedResponse } from "./common.schema";

const createBookingSchema = z
  .object({
    tourId: z.string().min(1, "tourId is required"),

    scheduleId: z.string().min(1, "scheduleId is required"),

    numberOfParticipants: z.coerce
      .number()
      .positive("Number of participants must be greater than 0")
      .int("numberOfParticipants must be an integer")
      .min(1, "At least 1 participant is required"),

    needsGuide: z.boolean().default(false),
    numberOfGuideNeeds: z.coerce
      .number()
      .positive("Number of guides must be greater than 0")
      .int("numberOfGuideNeeds must be an integer")
      .optional(),
    guidePricingType: z.nativeEnum(GuidePricingType).optional(),
  })
  .refine(
    (data) => {
      if (!data.needsGuide) return true;

      // PER_DAY requires guide number
      if (data.guidePricingType === GuidePricingType.PER_DAY) {
        return (
          data.numberOfGuideNeeds !== undefined && data.numberOfGuideNeeds >= 1
        );
      }

      // PER_PERSON / PER_GROUP → guide number optional
      return true;
    },
    {
      message:
        "Number of guides needed must be at least 1 when pricing is PER_DAY",
      path: ["numberOfGuideNeeds"],
    }
  )

  .refine(
    (data) => {
      if (data.needsGuide) {
        return data.guidePricingType !== undefined;
      }
      return true;
    },
    {
      message: "Guide pricing type must be selected if guide is needed",
      path: ["guidePricingType"],
    }
  );

const updateBookingSchema = z
  .object({
    numberOfParticipants: z.coerce.number().positive().int().optional(),

    needsGuide: z.boolean().optional(),

    numberOfGuideNeeds: z.coerce.number().positive().int().optional(),

    guidePricingType: z.nativeEnum(GuidePricingType).optional(),
  })
  .refine(
    (data) => {
      if (data.needsGuide === true) {
        return data.guidePricingType !== undefined;
      }
      return true;
    },
    {
      message: "Guide pricing type must be selected if guide is needed",
      path: ["guidePricingType"],
    }
  )
  .refine(
    (data) => {
      if (
        data.needsGuide === true &&
        data.guidePricingType === GuidePricingType.PER_DAY
      ) {
        return data.numberOfGuideNeeds !== undefined;
      }
      return true;
    },
    {
      message:
        "Number of guides needed must be at least 1 when pricing is PER_DAY",
      path: ["numberOfGuideNeeds"],
    }
  );

const updateBookingStatusSchema = z
  .object({
    status: z.nativeEnum(BookingStatus).openapi({
      example: BookingStatus.CANCELLED,
      description: "New booking status",
    }),
  })
  .openapi("UpdateBookingStatusRequest");

const tourBookingResponseSchema = z.object({
  id: z.string().openapi({ example: "booking_123abc" }),
  bookingCode: z.string().openapi({ example: "BK-20260107-001" }),
  userId: z.string(),
  tourId: z.string(),
  scheduleId: z.string(),
  destinationId: z.string(),
  numberOfParticipants: z.number(),
  pricePerParticipantAtBooking: z.number(),
  basePriceAtBooking: z.number(),
  discountRateAtBooking: z.number().optional(),
  discountAmountAtBooking: z.number().optional(),
  finalTourPrice: z.number(),
  needsGuide: z.boolean(),
  numberOfGuides: z.number().optional(),
  guidePricingType: z.nativeEnum(GuidePricingType).optional(),
  guidePriceAtBooking: z.number().optional(),
  guideMinimumCharge: z.number().optional(),
  guideTotalPrice: z.number().optional(),
  totalPrice: z.number(),
  status: z.nativeEnum(BookingStatus),
  bookingDate: z.string(),
  cancelledAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  updatedAt: z.string(),
});
const tourBookingListResponseSchema = paginatedResponse(
  tourBookingResponseSchema
);

const bookingStatsResponseSchema = z
  .object({
    totalBookings: z.number().openapi({ example: 120 }),
    pendingBookings: z.number().openapi({ example: 25 }),
    confirmedBookings: z.number().openapi({ example: 60 }),
    cancelledBookings: z.number().openapi({ example: 20 }),
    completedBookings: z.number().openapi({ example: 15 }),
    totalRevenue: z.number().openapi({ example: 250000 }),
  })
  .openapi("BookingStatsResponse");

const bookingQuerySchema = z.object({
  bookingId: z.string().optional().openapi({
    example: "booking_123abc",
    description: "Filter by booking ID",
  }),
  tourId: z.string().optional().openapi({
    example: "tour_123abc",
    description: "Filter by tour ID",
  }),
  scheduleId: z
    .string()
    .optional()
    .openapi({ example: "sched_456def", description: "Filter by schedule ID" }),
  destinationId: z.string().optional().openapi({
    example: "destination_123ghi",
    description: "Filter by destination ID",
  }),
  userId: z
    .string()
    .optional()
    .openapi({ example: "user_789jkl", description: "Filter by user ID" }),

  status: z.nativeEnum(BookingStatus).optional().openapi({
    example: "true",
    description: "Filter by active status",
  }),
  needsGuide: z.boolean().optional(),
  page: z.coerce.number().optional().default(1).openapi({
    example: 1,
    description: "Page number for pagination",
  }),
  limit: z.coerce.number().optional().default(10).openapi({
    example: 10,
    description: "Number of items per page",
  }),
  sortBy: z.string().optional().openapi({
    example: "startDate",
    description: "Sort by field",
  }),
  sortOrder: z.string().optional().default("asc").openapi({
    example: "asc",
    description: "Sort order",
  }),
});

type BookingQueryParams = z.infer<typeof bookingQuerySchema>;

const bookingParamsSchema = z.object({
  bookingId: z.string().min(1).openapi({ example: "booking_123abc" }),
});

export {
  createBookingSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
  tourBookingResponseSchema,
  bookingQuerySchema,
  tourBookingListResponseSchema,
  bookingStatsResponseSchema,
  BookingQueryParams,
  bookingParamsSchema,
};
