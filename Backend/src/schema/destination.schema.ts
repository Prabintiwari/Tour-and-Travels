import z from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { paginatedResponse } from "./common.schema";

extendZodWithOpenApi(z);

const destinationSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    region: z.string().min(1, "Region is required"),
    location: z.string().min(1, "Location is required"),
    bestTimeToVisit: z.string().min(1, "Best time to visit is required"),

    attractions: z.preprocess((val) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val;
    }, z.array(z.string()).min(1, "At least one attraction is required")),
  })
  .openapi("DestinationRequest");

const updateDestinationSchema = destinationSchema
  .partial()
  .openapi("UpdateDestinationRequest");

const destinationResponseSchema = z
  .object({
    id: z.string().openapi({ example: "dest_123abc" }),
    name: z.string().openapi({ example: "Pokhara" }),
    description: z.string().openapi({ example: "Beautiful lake city" }),
    region: z.string().openapi({ example: "Gandaki" }),
    location: z.string().openapi({ example: "Nepal" }),
    bestTimeToVisit: z.string().openapi({ example: "October - March" }),
    attractions: z
      .array(z.string())
      .openapi({ example: ["Phewa Lake", "Sarangkot"] }),

    createdAt: z.string().openapi({ example: "2024-01-01T10:00:00Z" }),
    updatedAt: z.string().openapi({ example: "2024-01-01T10:00:00Z" }),
  })
  .openapi("DestinationResponse");

const destinationListResponseSchema = paginatedResponse(
  destinationResponseSchema
).openapi("DestinationListResponse");

const getAllDestinationsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),

    region: z.string().optional(),
    search: z.string().optional(),

    sortBy: z
      .enum(["name", "createdAt"])
      .optional()
      .openapi({ example: "name" }),

    order: z.enum(["asc", "desc"]).optional().openapi({ example: "asc" }),
  })
  .openapi("GetAllDestinationsQuery");

const destinationIdParamSchema = z
  .object({
    destinationId: z.string().openapi({ example: "dest_123abc" }),
  })
  .openapi("DestinationIdParam");

type DestinationQueryParams = z.infer<typeof getAllDestinationsQuerySchema>;
type DestinationIdQueryParams = z.infer<typeof destinationIdParamSchema>;

export {
  destinationSchema,
  updateDestinationSchema,
  destinationResponseSchema,
  destinationListResponseSchema,
  getAllDestinationsQuerySchema,
  destinationIdParamSchema,
  DestinationQueryParams,
  DestinationIdQueryParams,
};
