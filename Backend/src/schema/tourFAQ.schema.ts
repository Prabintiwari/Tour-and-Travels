import z from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { paginatedResponse } from "./common.schema";

extendZodWithOpenApi(z);

const createTourFAQSchema = z
  .object({
    tourId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid tour ID")
      .openapi({
        description: "Tour ObjectId",
        example: "507f1f77bcf86cd799439011",
      }),
    question: z.string().min(5).max(500).openapi({
      description: "FAQ question",
      example: "What is the cancellation policy?",
    }),
    answer: z.string().min(10).max(2000).openapi({
      description: "FAQ answer",
      example:
        "You can cancel up to 7 days before the tour starts for a full refund.",
    }),
    isActive: z.boolean().default(true).optional().openapi({
      description: "Whether the FAQ is active",
      example: true,
    }),
  })
  .openapi("CreateTourFAQ");

const updateTourFAQSchema = z
  .object({
    question: z.string().min(5).max(500).optional().openapi({
      description: "FAQ question",
      example: "What is the refund policy?",
    }),
    answer: z.string().min(10).max(2000).optional().openapi({
      description: "FAQ answer",
      example:
        "Full refund available for cancellations made 7+ days in advance.",
    }),
    isActive: z.boolean().optional().openapi({
      description: "Whether the FAQ is active",
      example: true,
    }),
  })
  .openapi("UpdateTourFAQ");

const tourFAQBaseSchema = createTourFAQSchema
  .omit({ tourId: true })
  .openapi("TourFAQBase");

const bulkCreateTourFAQsSchema = z
  .object({
    faqs: z
      .array(tourFAQBaseSchema)
      .min(1, "At least one FAQ is required")
      .openapi({
        description: "List of FAQs to create for a tour",
      }),
  })
  .openapi("BulkCreateTourFAQs");

const bulkUpdateTourFAQsSchema = z
  .object({
    faqs: z.array(
      tourFAQBaseSchema.partial().extend({
        faqId: z
          .string()
          .regex(/^[0-9a-fA-F]{24}$/, "Invalid FAQ ID")
          .openapi({
            description: "FAQ ObjectId",
            example: "507f1f77bcf86cd799439012",
          }),
      })
    ),
  })
  .openapi("BulkUpdateTourFAQs");

const bulkDeleteFAQsSchema = z
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
  .openapi("bulkDeleteFAQsRequest");

const tourFAQResponseSchema = z
  .object({
    id: z.string().openapi({ example: "507f1f77bcf86cd799439015" }),
    tourId: z.string().openapi({ example: "507f1f77bcf86cd799439011" }),
    question: z.string().openapi({ example: "What should I bring?" }),
    answer: z
      .string()
      .openapi({ example: "Comfortable shoes, water bottle, and sunscreen." }),
    isActive: z.boolean().openapi({ example: true }),
    createdAt: z.string().openapi({ example: "2024-01-01T00:00:00.000Z" }),
    updatedAt: z.string().openapi({ example: "2024-01-01T00:00:00.000Z" }),
  })
  .openapi("TourFAQResponse");

const tourFAQsListResponseSchema = paginatedResponse(
  tourFAQResponseSchema
).openapi("TourFAQsListResponse");

const tourFAQSQuerySchema = z.object({
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
const allFAQSQuerySchema = z.object({
  tourId: z.string().optional().openapi({
    example: "tour_123abc",
    description: "Filter by tour ID",
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
const searchFAQSQuerySchema = z.object({
  tourId: z.string().optional().openapi({
    example: "tour_123abc",
    description: "Filter by tour ID",
  }),
  searchQuery: z.string().openapi({
    example: "What is the cancellation policy?",
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
    example: "startDate",
    description: "Sort by field",
  }),
  sortOrder: z.string().optional().default("asc").openapi({
    example: "asc",
    description: "Sort order",
  }),
});

const tourFAQIdParamsSchema = z.object({
  faqId: z.string().min(1).openapi({ example: "Faq_123abc" }),
});

const FAQsStatisticsQuerySchema = z.object({
  tourId: z.string().optional().openapi({
    example: "tour_123abc",
    description: "Filter by tour ID",
  }),
  destinationId: z.string().optional().openapi({
    example: "dest_123abc",
    description: "Filter by destination ID",
  }),
});

export {
  createTourFAQSchema,
  updateTourFAQSchema,
  bulkCreateTourFAQsSchema,
  bulkUpdateTourFAQsSchema,
  tourFAQResponseSchema,
  bulkDeleteFAQsSchema,
  tourFAQsListResponseSchema,
  tourFAQIdParamsSchema,
  allFAQSQuerySchema,
  tourFAQSQuerySchema,
  searchFAQSQuerySchema,
  FAQsStatisticsQuerySchema,
};
