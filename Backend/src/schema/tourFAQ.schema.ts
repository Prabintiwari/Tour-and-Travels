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

type CreateTourFAQInput = z.infer<typeof createTourFAQSchema>;
type UpdateTourFAQInput = z.infer<typeof updateTourFAQSchema>;

export {
  createTourFAQSchema,
  updateTourFAQSchema,
  tourFAQResponseSchema,
  tourFAQsListResponseSchema,
  CreateTourFAQInput,
  UpdateTourFAQInput,
};
