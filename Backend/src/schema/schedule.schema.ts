import z from "zod";

const today = new Date();
today.setHours(0, 0, 0, 0);

const createTourScheduleSchema = z
  .object({
    tourId: z.string().min(1, "Tour ID is required"),

    title: z.string().min(1, "Title is required"),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),

    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Start date must be in YYYY-MM-DD format",
    }),

    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "End date must be in YYYY-MM-DD format",
    }),

    availableSeats: z
      .number()
      .int()
      .positive("Available seats must be a positive integer"),

    price: z.number().positive("Price must be positive"),

    isActive: z.boolean().optional().default(true),
  })

  /* Prevent past start date */
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      return start >= today;
    },
    {
      message: "Start date cannot be in the past",
      path: ["startDate"],
    }
  )

  /* Prevent past end date */
  .refine(
    (data) => {
      const end = new Date(data.endDate);
      return end >= today;
    },
    {
      message: "End date cannot be in the past",
      path: ["endDate"],
    }
  )

  /*  End date must be after start date */
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

export { createTourScheduleSchema, updateTourScheduleSchema };
