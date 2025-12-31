import z from "zod";
import {
  AccommodationType,
  DifficultyLevel,
  MealType,
  UserRole,
} from "@prisma/client";

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password too long"),
  fullName: z.string().min(2, "fullName must be at least 2 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),

  phone: z
    .string()
    .regex(/^[0-9]{7,15}$/, "Invalid phone number")
    .optional(),

  profileImage: z.string().url("Profile image must be a valid URL").optional(),

  address: z.string().optional(),

  street: z.string().optional(),

  city: z.string().optional(),

  country: z.string().optional(),

  dateOfBirth: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Date must be in YYYY-MM-DD format",
    }),
});

const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

const destinationSchema = z.object({
  name: z.string().min(1, "Name is required"),

  description: z.string().min(10, "Description must be at least 10 characters"),

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
  }, z.array(z.string()).min(1)),
});

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
      !data.guidePricePerDay &&
      !data.guidePricePerPerson &&
      !data.guidePricePerGroup
        ? true
        : true,
    {
      message:
        "At least one guide pricing option (per day, per person, or per group) should be provided",
      path: ["guidePricePerDay"],
    }
  );

const updateTourSchema = createTourSchema
  .omit({ destinationId: true })
  .partial()
  .extend({ isActive: z.coerce.boolean().optional().default(true) });

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

const createTourScheduleSchema = z
  .object({
    tourId: z.string().min(1, "Tour ID is required"),
    startDate: z
      .string()
      .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: "Date must be in YYYY-MM-DD format",
      }),
    endDate: z
      .string()
      .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: "Date must be in YYYY-MM-DD format",
      }),
    availableSeats: z
      .number()
      .int()
      .positive("Available seats must be positive"),
    price: z.number().positive("Price must be positive"),
    isActive: z.boolean().optional().default(true),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

const updateTourScheduleSchema = createTourScheduleSchema
  .omit({ tourId: true })
  .partial()
  .extend({
    currentBookings: z
      .number()
      .int()
      .min(0, "Current bookings cannot be negative")
      .optional(),
  });

const createBookingSchema = z.object({
  tourId: z.string().min(1, "tourId is required"),

  scheduleId: z.string().min(1, "scheduleId is required"),

  destinationId: z.string().min(1, "destinationId is required"),

  numberOfParticipants: z.coerce
    .number()
    .positive("Number of days must be greater than 0")
    .int("numberOfParticipants must be an integer")
    .min(1, "At least 1 participant is required"),

  needsGuide: z.boolean("needsGuide is required"),

  discountRate: z
    .number()
    .min(0, "discountRate cannot be negative")
    .max(100, "discountRate cannot exceed 100")
    .default(0),
});

export {
  registerSchema,
  loginSchema,
  updateUserSchema,
  updateUserRoleSchema,
  destinationSchema,
  createTourSchema,
  updateTourSchema,
  defaultGuidePricingSchema,
  createItinerarySchema,
  updateItinerarySchema,
  createTourScheduleSchema,
  updateTourScheduleSchema,
  createBookingSchema,
};
