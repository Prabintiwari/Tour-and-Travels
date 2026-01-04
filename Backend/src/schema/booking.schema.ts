import z from "zod";
import { GuidePricingType } from "@prisma/client";

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

export { createBookingSchema };
