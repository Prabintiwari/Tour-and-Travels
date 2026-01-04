import { DifficultyLevel } from "@prisma/client";
import z from "zod";

const createTourSchema = z
  .object({
    destinationId: z.string().min(1, "Destination ID is required"),

    title: z.string().min(1, "Title is required"),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),

    numberOfDays: z.coerce
      .number()
      .int()
      .positive("Number of days must be greater than 0"),

    basePrice: z.coerce.number().positive("Base price must be greater than 0"),
    discountRate: z.coerce
      .number()
      .min(0, "Discount rate cannot be negative")
      .max(100, "Discount rate cannot exceed 100")
      .optional(),
    discountAmount: z.coerce
      .number()
      .min(0, "Discount amount cannot be negative")
      .optional(),
    discountActive: z.boolean().optional().default(false),

    maxParticipants: z.coerce
      .number()
      .int()
      .positive("Max participants must be greater than 0")
      .optional(),

    minParticipants: z.coerce
      .number()
      .int()
      .positive("Min participants must be greater than 0")
      .optional(),

    difficultyLevel: z.nativeEnum(DifficultyLevel).optional(),

    isFeatured: z.coerce.boolean().optional().default(false),
    guidePricePerDay: z.coerce
      .number()
      .min(0, "Guide price per day cannot be negative")
      .optional(),

    guidePricePerPerson: z.coerce
      .number()
      .min(0, "Guide price per person cannot be negative")
      .optional(),

    guidePricePerGroup: z.coerce
      .number()
      .min(0, "Guide price per group cannot be negative")
      .optional(),

    guideMinimumCharge: z.coerce
      .number()
      .min(0, "Guide minimum charge cannot be negative")
      .optional(),

    guideMaximumGroupSize: z.coerce
      .number()
      .int()
      .positive("Guide maximum group size must be greater than 0")
      .optional(),

    guideDescription: z
      .string()
      .min(5, "Guide description must be at least 5 characters")
      .optional(),
  })
  .refine(
    (data) =>
      !data.minParticipants ||
      !data.maxParticipants ||
      data.minParticipants <= data.maxParticipants,
    {
      message: "Min participants cannot be greater than max participants",
      path: ["minParticipants"],
    }
  )
  .refine(
    (data) =>
      data.guidePricePerDay !== undefined ||
      data.guidePricePerPerson !== undefined ||
      data.guidePricePerGroup !== undefined,
    {
      message:
        "At least one guide pricing option (per day, per person, or per group) should be provided",
      path: ["guidePricePerDay"],
    }
  )
  .refine(
    (data) => {
      if (!data.discountActive) return true;

      return (
        data.discountAmount !== undefined || data.discountRate !== undefined
      );
    },
    {
      message:
        "Either discountRate or discountAmount must be provided when discount is active",
      path: ["discountAmount"],
    }
  )
  .refine(
    (data) => {
      if (!data.discountActive) return true;

      const hasAmount = data.discountAmount !== undefined;
      const hasRate = data.discountRate !== undefined;

      return hasAmount !== hasRate;
    },
    {
      message:
        "Provide either discountAmount or discountRate (not both) when discount is active",
      path: ["discountAmount"],
    }
  );

const updateTourSchema = createTourSchema
  .omit({ destinationId: true })
  .partial()
  .extend({ isActive: z.coerce.boolean().optional().default(true) })
  .refine(
    (data) => {
      if (!data.discountActive) return true;

      const hasAmount = data.discountAmount !== undefined;
      const hasRate = data.discountRate !== undefined;

      return hasAmount !== hasRate;
    },
    {
      message:
        "Provide either discountAmount or discountRate (not both) when discount is active",
      path: ["discountAmount"],
    }
  );

  
  
  
  
  const defaultGuidePricingSchema = z
    .object({
      pricePerDay: z.coerce
        .number()
        .min(0, "Price per day cannot be negative")
        .optional(),
  
      pricePerPerson: z.coerce
        .number()
        .min(0, "Price per person cannot be negative")
        .optional(),
  
      pricePerGroup: z.coerce
        .number()
        .min(0, "Price per group cannot be negative")
        .optional(),
  
      minimumCharge: z.coerce
        .number()
        .min(0, "Minimum charge cannot be negative")
        .optional(),
  
      maximumGroupSize: z.coerce
        .number()
        .int("Maximum group size must be an integer")
        .positive("Maximum group size must be greater than 0")
        .optional(),
  
      description: z
        .string()
        .min(5, "Description must be at least 5 characters")
        .optional(),
    })
    .refine(
      (data) =>
        data.pricePerDay !== undefined ||
        data.pricePerPerson !== undefined ||
        data.pricePerGroup !== undefined,
      {
        message:
          "At least one pricing option (per day, per person, or per group) is required",
        path: ["pricePerDay"],
      }
    )
    .strict();

export { createTourSchema, updateTourSchema,defaultGuidePricingSchema };
