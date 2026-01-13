import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { paginatedResponse } from "./common.schema";

extendZodWithOpenApi(z);

const CustomItinerarySchema = z.object({
  id: z.string().openapi({ example: "itinerary_123abc" }),
  destinationId: z.string().openapi({ example: "destination_456def" }),
  title: z.string().max(200).openapi({ example: "7 Days Kathmandu Tour" }),
  description: z.string().max(2000).nullable().openapi({
    example: "A cultural and adventure focused itinerary",
  }),
  numberOfDays: z.number().int().positive().max(365).nullable().openapi({
    example: 7,
  }),
  createdAt: z.string().datetime().openapi({
    example: "2025-01-10T10:30:00.000Z",
  }),
  updatedAt: z.string().datetime().openapi({
    example: "2025-01-12T08:15:00.000Z",
  }),
});

const createCustomItinerarySchema = z
  .object({
    destinationId: z.string().min(1).openapi({
      example: "destination_456def",
    }),
    title: z.string().min(1).max(200).openapi({
      example: "7 Days Kathmandu Tour",
    }),
    description: z.string().max(2000).optional().openapi({
      example: "A perfect itinerary for first-time visitors",
    }),
    numberOfDays: z.number().int().positive().max(365).optional().openapi({
      example: 7,
    }),
  })
  .openapi("CreateCustomItineraryRequest");

const updateCustomItinerarySchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    numberOfDays: z.number().int().positive().max(365).optional(),
  })
  .openapi("UpdateCustomItineraryRequest");

const customItineraryquerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  destinationId: z.string().optional().openapi({
    example: "destination_456def",
  }),
});

const customItineraryParamsSchema = z
  .object({
    itineraryId: z.string().min(1).openapi({
      example: "itinerary_123abc",
    }),
  })
  .openapi("CustomItineraryParams");

const CustomItineraryResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    data: CustomItinerarySchema,
  })
  .openapi("CustomItineraryResponse");

const CustomItineraryListResponseSchema = paginatedResponse(
  CustomItineraryResponseSchema
).openapi("CustomItineraryListResponse");

export {
  CustomItinerarySchema,
  createCustomItinerarySchema,
  updateCustomItinerarySchema,
  customItineraryquerySchema,
  customItineraryParamsSchema,
  CustomItineraryResponseSchema,
  CustomItineraryListResponseSchema,
};
