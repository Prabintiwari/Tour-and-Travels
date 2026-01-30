import z from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { paginatedResponse } from "./common.schema";
import { VehicleType } from "@prisma/client";

extendZodWithOpenApi(z);

const createVehicleFAQSchema = z
  .object({
    vehicleId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid tour ID")
      .openapi({
        description: "Vehicle ObjectId",
        example: "507f1f77bcf86cd799439011",
      }),
    vehicleType: z.nativeEnum(VehicleType).optional().openapi({
      description: "Vehicle type (optional, for generic FAQs)",
      example: "CAR",
    }),
    question: z.string().min(5).max(500).openapi({
      description: "FAQ question",
      example: "What documents are required for renting?",
    }),
    answer: z.string().min(10).max(2000).openapi({
      description: "FAQ answer",
      example:
        "You need a valid driver's license, national ID or passport, and a security deposit.",
    }),
    isActive: z.boolean().default(true).optional().openapi({
      description: "Whether the FAQ is active",
      example: true,
    }),
  })
  .openapi("CreateVehicleFAQ");

const updateVehicleFAQSchema = z
  .object({
    vehicleType: z.nativeEnum(VehicleType).optional().openapi({
      description: "Updated vehicle type",
      example: "MOTORCYCLE",
    }),
    question: z.string().min(5).max(500).optional().openapi({
      description: "Updated FAQ question",
      example: "What is the minimum age requirement?",
    }),
    answer: z.string().min(10).max(2000).optional().openapi({
      description: "FAQ answer",
      example: "The minimum age for renting is 21 years with a valid license.",
    }),
    isActive: z.boolean().optional().openapi({
      description: "Updated active status",
      example: true,
    }),
  })
  .openapi("UpdateVehicleFAQ");

const vehicleFAQBaseSchema = createVehicleFAQSchema
  .omit({ vehicleId: true })
  .openapi("VehicleFAQBase");

const bulkCreateVehicleFAQsSchema = z
  .object({
    faqs: z
      .array(vehicleFAQBaseSchema)
      .min(1, "At least one FAQ is required")
      .openapi({
        description: "List of FAQs to create for a tour",
      }),
  })
  .openapi("BulkCreateTourFAQs");

const bulkUpdateVehicleFAQsSchema = z
  .object({
    faqs: z.array(
      vehicleFAQBaseSchema.partial().extend({
        faqId: z
          .string()
          .regex(/^[0-9a-fA-F]{24}$/, "Invalid FAQ ID")
          .openapi({
            description: "FAQ ObjectId",
            example: "507f1f77bcf86cd799439012",
          }),
      }),
    ),
  })
  .openapi("BulkUpdateVehicleFAQs");

const bulkDeleteVehicleFAQsSchema = z
  .object({
    faqIds: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid FAQ ID"))
      .min(1, "At least one faqId is required")
      .max(100, "Cannot delete more than 100 FAQs at once")
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "Duplicate faqIds are not allowed",
      })
      .openapi({
        example: ["507f1f77bcf86cd799439012", "6962901c6bb019b3ff9f2c25"],
      }),
  })
  .openapi("bulkDeleteVehicleFAQsRequest");

const vehicleFAQResponseSchema = z
    .object({
        id: z.string().openapi({ example: "507f1f77bcf86cd799439015" }),
        vehicleId: z.string().openapi({ example: "507f1f77bcf86cd799439011" }),
        vehicleType: z.nativeEnum(VehicleType).optional().openapi({ example: "CAR" }),
        question: z.string().min(5).max(500).openapi({ example: "What documents are required for renting?" }),
        answer: z
            .string()
            .min(10)
            .max(2000)
            .openapi({ example: "You need a valid driver's license, national ID or passport, and a security deposit." }),
        isActive: z.boolean().openapi({ example: true }),
        createdAt: z.string().openapi({ example: "2024-01-01T00:00:00.000Z" }),
        updatedAt: z.string().openapi({ example: "2024-01-01T00:00:00.000Z" }),
    })
    .openapi("VehicleFAQResponse");

const vehicleFAQsListResponseSchema = paginatedResponse(
  vehicleFAQResponseSchema,
).openapi("TourFAQsListResponse");

const vehicleFAQSQuerySchema = z.object({
  page: z.coerce.number().optional().default(1).openapi({
    example: 1,
    description: "Page number for pagination",
  }),
  limit: z.coerce.number().optional().default(10).openapi({
    example: 10,
    description: "Number of items per page",
  }),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.string().optional().openapi({
    example: "startDate",
    description: "Sort by field",
  }),
  sortOrder: z.string().optional().default("asc").openapi({
    example: "asc",
    description: "Sort order",
  }),
});
const allVehicleFAQSQuerySchema = z.object({
  vehicleId: z.string().optional().openapi({
    example: "vehicle_123abc",
    description: "Filter by vehicle ID",
  }),
  page: z.coerce.number().optional().default(1).openapi({
    example: 1,
    description: "Page number for pagination",
  }),
  limit: z.coerce.number().optional().default(10).openapi({
    example: 10,
    description: "Number of items per page",
  }),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.string().optional().openapi({
    example: "startDate",
    description: "Sort by field",
  }),
  sortOrder: z.string().optional().default("asc").openapi({
    example: "asc",
    description: "Sort order",
  }),
});

const searchVehicleFAQSQuerySchema = z.object({
  vehicleId: z.string().optional().openapi({
    example: "vehicle_123abc",
    description: "Filter by vehicle ID",
  }),
  searchQuery: z.string().openapi({
    example: "What documents are required for renting?",
    description: "FAQ question",
  }),
  page: z.coerce.number().optional().default(1).openapi({
    example: 1,
    description: "Page number for pagination",
  }),
  limit: z.coerce.number().optional().default(10).openapi({
    example: 10,
    description: "Number of items per page",
  }),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.string().optional().default("createdAt").openapi({
    example: "createdAt",
    description: "Sort by field",
  }),
  sortOrder: z.string().optional().default("asc").openapi({
    example: "asc",
    description: "Sort order",
  }),
});

const vehicleFAQIdParamsSchema = z.object({
  faqId: z.string().min(1).openapi({ example: "Faq_123abc" }),
});

const vehicleFAQsStatisticsQuerySchema = z.object({
  vehicleId: z.string().optional().openapi({
    example: "vehicle_123abc",
    description: "Filter by vehicle ID",
  })
});

const copyVehicleFAQsParamsSchema = z.object({
  sourceVehicleId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid source vehicle ID")
    .openapi({ description: "Source Vehicle ObjectId" }),
  targetVehicleId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid target vehicle ID")
    .openapi({ description: "Target Vehicle ObjectId" }),
});

const copyVehicleFAQsSchema = z
  .object({
    includeInactive: z.boolean().optional().default(false).openapi({
      description: "Whether to include inactive FAQs",
      example: false,
    }),
  })
  .openapi("CopyVehicleFAQsBody");

export {
  createVehicleFAQSchema,
  updateVehicleFAQSchema,
  bulkCreateVehicleFAQsSchema,
  bulkUpdateVehicleFAQsSchema,
  vehicleFAQResponseSchema,
  bulkDeleteVehicleFAQsSchema,
  vehicleFAQsListResponseSchema,
  vehicleFAQIdParamsSchema,
  allVehicleFAQSQuerySchema,
  vehicleFAQSQuerySchema,
  searchVehicleFAQSQuerySchema,
  vehicleFAQsStatisticsQuerySchema,
  copyVehicleFAQsParamsSchema,
  copyVehicleFAQsSchema,
};
