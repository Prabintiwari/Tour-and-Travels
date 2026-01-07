import { AccommodationType, MealType } from "@prisma/client";
import { z } from "zod"; // default import होइन
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { paginatedResponse } from "./common.schema";

extendZodWithOpenApi(z);

// Activity Schema
const activitySchema = z
  .object({
    time: z.string().openapi({ example: "09:00 AM" }),
    activity: z.string().openapi({ example: "Breakfast at hotel" }),
    location: z.string().openapi({ example: "Hotel Restaurant" }),
  })
  .openapi("Activity");

type activityType = z.infer<typeof activitySchema>;

// Create Itinerary Request Schema
const createItinerarySchema = z
  .object({
    tourId: z.string().min(1, "Tour ID is required").openapi({
      example: "tour_123abc",
    }),
    day: z.number().min(1, "Day must be at least 1").openapi({
      example: 1,
    }),
    title: z.string().min(1, "Title is required").openapi({
      example: "Arrival in Kathmandu",
    }),
    description: z.string().optional().openapi({
      example:
        "Arrive at Tribhuvan International Airport and transfer to hotel",
    }),
    activities: z
      .array(activitySchema)
      .optional()
      .default([])
      .openapi({
        example: [
          {
            time: "09:00 AM",
            activity: "Breakfast at hotel",
            location: "Hotel Restaurant",
          },
          {
            time: "10:00 AM",
            activity: "City tour",
            location: "Kathmandu Durbar Square",
          },
        ],
      }),
    accommodationType: z
      .nativeEnum(AccommodationType)
      .optional()
      .openapi({
        example: AccommodationType.HOTEL,
        enum: Object.values(AccommodationType),
      }),
    mealInclusions: z
      .array(z.nativeEnum(MealType))
      .optional()
      .default([])
      .openapi({
        example: [MealType.BREAKFAST, MealType.DINNER],
        description: "Array of meal types included",
      }),
  })
  .openapi("CreateItineraryRequest");

// Update Itinerary Request Schema
const updateItinerarySchema = createItinerarySchema
  .omit({ tourId: true })
  .partial()
  .openapi("UpdateItineraryRequest");

// Itinerary Response Schema
const itineraryResponseSchema = z
  .object({
    id: z.string().openapi({ example: "itinerary_123abc" }),
    tourId: z.string().openapi({ example: "tour_123abc" }),
    day: z.number().openapi({ example: 1 }),
    title: z.string().openapi({ example: "Arrival in Kathmandu" }),
    description: z.string().nullable().openapi({
      example:
        "Arrive at Tribhuvan International Airport and transfer to hotel",
    }),
    activities: z.array(activitySchema).openapi({
      example: [
        {
          time: "09:00 AM",
          activity: "Breakfast at hotel",
          location: "Hotel Restaurant",
        },
      ],
    }),
    accommodationType: z.nativeEnum(AccommodationType).nullable().openapi({
      example: AccommodationType.HOTEL,
    }),
    mealInclusions: z.array(z.nativeEnum(MealType)).openapi({
      example: [MealType.BREAKFAST, MealType.DINNER],
    }),
    createdAt: z.string().openapi({ example: "2024-01-01T10:00:00Z" }),
    updatedAt: z.string().openapi({ example: "2024-01-02T10:00:00Z" }),
  })
  .openapi("ItineraryResponse");

// Itinerary List Response Schema
const itineraryListResponseSchema = paginatedResponse(
  itineraryResponseSchema
).openapi("ItineraryListResponse");

// Add Activities Request Schema
const addActivitiesSchema = z
  .object({
    activities: z
      .array(activitySchema)
      .min(1, "At least one activity is required")
      .openapi({
        example: [
          {
            time: "02:00 PM",
            activity: "Visit Swayambhunath Temple",
            location: "Swayambhunath",
          },
          {
            time: "04:00 PM",
            activity: "Explore Thamel",
            location: "Thamel Market",
          },
        ],
      }),
  })
  .openapi("AddActivitiesRequest");

// Remove Activities Request Schema
const removeActivitiesSchema = z
  .object({
    activityIndexes: z
      .array(z.number().min(0))
      .min(1, "At least one activity index is required")
      .openapi({
        example: [0, 2],
        description: "Array of activity indexes to remove (0-based indexing)",
      }),
  })
  .openapi("RemoveActivitiesRequest");

  // Activity Updated Response
const activityOperationResponseSchema = z
  .object({
    message: z.string().openapi({ 
      example: "Activities updated successfully" 
    }),
    itinerary: itineraryResponseSchema,
  })
  .openapi("ActivityOperationResponse");

// ID Param Schema
const itineraryIdParamSchema = z.object({
  itineraryId: z.string().openapi({
    param: {
      name: "itineraryId",
      in: "path",
    },
    example: "itinerary_123abc",
  }),
});

// Query Schema for filtering
const itineraryQuerySchema = z.object({
  tourId: z.string().optional().openapi({
    example: "tour_123abc",
    description: "Filter by tour ID",
  }),
  day: z.coerce.number().optional().openapi({
    example: 1,
    description: "Filter by day number",
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

export {
  activityType,
  createItinerarySchema,
  updateItinerarySchema,
  itineraryResponseSchema,
  itineraryListResponseSchema,
  addActivitiesSchema,
  removeActivitiesSchema,
  activityOperationResponseSchema,
  itineraryIdParamSchema,
  itineraryQuerySchema,
  activitySchema,
};
