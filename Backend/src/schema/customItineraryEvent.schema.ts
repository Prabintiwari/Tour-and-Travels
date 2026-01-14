import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { CustomItineraryEventType } from "@prisma/client";
import { z } from "zod";
import { paginatedResponse } from "./common.schema";

extendZodWithOpenApi(z);

const customItineraryEventBaseSchema = z
  .object({
    title: z.string().min(1).max(200).openapi({
      example: "City Sightseeing",
    }),

    description: z.string().max(2000).optional().openapi({
      example: "Visit Kathmandu Durbar Square",
    }),

    startTime: z.string().datetime().optional().openapi({
      example: "2026-01-15T09:00:00.000Z",
    }),

    endTime: z.string().datetime().optional().openapi({
      example: "2026-01-15T12:00:00.000Z",
    }),

    location: z.string().max(255).optional().openapi({
      example: "Kathmandu Durbar Square",
    }),

    type: z.nativeEnum(CustomItineraryEventType).openapi({
      example: CustomItineraryEventType.ACTIVITY,
      enum: Object.values(CustomItineraryEventType),
    }),

    notes: z.string().max(2000).optional().openapi({
      example: "Carry water and wear comfortable shoes",
    }),
  })
  .refine(
    (data) =>
      data.type !== CustomItineraryEventType.ACTIVITY || !!data.startTime,
    {
      message: "ACTIVITY must have startTime",
      path: ["startTime"],
    }
  );

const createCustomItineraryEventSchema = z
  .object({
    day: z.number().int().min(1).optional().openapi({
      example: 1,
      description: "Day number in itinerary",
    }),

    order: z.number().int().min(0).optional().openapi({
      example: 0,
      description: "Order within the same day",
    }),
  })
  .merge(customItineraryEventBaseSchema)
  .openapi("CreateCustomItineraryEventRequest");

const updateCustomItineraryEventSchema = createCustomItineraryEventSchema
  .partial()
  .openapi("UpdateCustomItineraryEventRequest");

const customItineraryEventQuerySchema = z.object({
  itineraryId: z.string().optional().openapi({
    example: "itinerary_64fdab123",
  }),

  type: z.nativeEnum(CustomItineraryEventType).optional().openapi({
    example: CustomItineraryEventType.ACTIVITY,
  }),
  page: z.coerce.number().optional().default(1).openapi({
    example: 1,
    description: "Page number for pagination",
  }),
  limit: z.coerce.number().optional().default(10).openapi({
    example: 10,
    description: "Number of items per page",
  }),
});

const customItineraryEventParamsSchema = z.object({
  itineraryId: z.string().optional().openapi({
    example: "itinerary_64fdab123",
  }),
  eventId: z.string().optional().openapi({
    example: "event_64fdab123",
  }),
});

const customItineraryEventResponseSchema = z
  .object({
    id: z.string().openapi({ example: "event_abc123" }),
    itineraryId: z.string().openapi({ example: "itinerary_64fdab123" }),

    title: z.string(),
    description: z.string().nullable(),

    startTime: z.string().datetime().nullable(),
    endTime: z.string().datetime().nullable(),

    location: z.string().nullable(),
    type: z.string().nullable(),
    notes: z.string().nullable(),

    day: z.number().nullable(),
    order: z.number().nullable(),

    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("CustomItineraryEventResponse");

const customItineraryEventListResponseSchema = paginatedResponse(
  customItineraryEventResponseSchema
).openapi("CustomItineraryEventListResponse");

export {
  customItineraryEventBaseSchema,
  createCustomItineraryEventSchema,
  updateCustomItineraryEventSchema,
  customItineraryEventQuerySchema,
  customItineraryEventParamsSchema,
  customItineraryEventResponseSchema,
  customItineraryEventListResponseSchema,
};
