import { AccommodationType, MealType } from "@prisma/client";
import z from "zod";

const createItinerarySchema = z.object({
  tourId: z.string().min(1, "Tour ID is required"),
  day: z.number().min(1, "Day must be at least 1"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  activities: z
    .array(
      z.object({
        time: z.string(),
        activity: z.string(),
        location: z.string(),
      })
    )
    .optional()
    .default([]),
  accommodationType: z.nativeEnum(AccommodationType).optional(),
  mealInclusions: z.array(z.nativeEnum(MealType)).optional().default([]),
});

const updateItinerarySchema = createItinerarySchema
  .omit({ tourId: true })
  .partial();


  export {createItinerarySchema,updateItinerarySchema}