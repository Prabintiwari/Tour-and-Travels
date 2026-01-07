import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

const today = new Date();
today.setHours(0, 0, 0, 0);

// Create Tour Schedule Request Schema
const createTourScheduleSchema = z
  .object({
    tourId: z.string().min(1, "Tour ID is required").openapi({
      example: "tour_123abc",
    }),

    title: z.string().min(1, "Title is required").openapi({
      example: "Summer Annapurna Trek 2024",
    }),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .openapi({
        example: "Join us for an amazing 10-day trek to Annapurna Base Camp",
      }),

    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "Start date must be in YYYY-MM-DD format",
      })
      .openapi({
        example: "2024-06-15",
        format: "date",
      }),

    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "End date must be in YYYY-MM-DD format",
      })
      .openapi({
        example: "2024-06-25",
        format: "date",
      }),

    availableSeats: z
      .number()
      .int()
      .positive("Available seats must be a positive integer")
      .openapi({
        example: 15,
      }),

    price: z.number().positive("Price must be positive").openapi({
      example: 1500.0,
    }),

    isActive: z.boolean().optional().default(true).openapi({
      example: true,
      default: true,
    }),
  })
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
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .openapi("CreateTourScheduleRequest");

// Update Tour Schedule Request Schema
const updateTourScheduleSchema = createTourScheduleSchema
  .omit({ tourId: true })
  .partial()
  .extend({
    currentBookings: z
      .number()
      .int()
      .min(0, "Current bookings cannot be negative")
      .optional()
      .openapi({
        example: 5,
      }),
  })
  .openapi("UpdateTourScheduleRequest");

// Tour Schedule Response Schema
const tourScheduleResponseSchema = z
  .object({
    id: z.string().openapi({ example: "schedule_123abc" }),
    tourId: z.string().openapi({ example: "tour_123abc" }),
    title: z.string().openapi({ example: "Summer Annapurna Trek 2024" }),
    description: z.string().openapi({
      example: "Join us for an amazing 10-day trek to Annapurna Base Camp",
    }),
    startDate: z.string().openapi({
      example: "2024-06-15",
      format: "date",
    }),
    endDate: z.string().openapi({
      example: "2024-06-25",
      format: "date",
    }),
    availableSeats: z.number().openapi({ example: 15 }),
    currentBookings: z.number().openapi({ example: 5 }),
    price: z.number().openapi({ example: 1500.0 }),
    isActive: z.boolean().openapi({ example: true }),
    createdAt: z.string().openapi({ example: "2024-01-01T10:00:00Z" }),
    updatedAt: z.string().openapi({ example: "2024-01-02T10:00:00Z" }),
  })
  .openapi("TourScheduleResponse");

// Tour Schedule List Response Schema
const tourScheduleListResponseSchema = z
  .object({
    schedules: z.array(tourScheduleResponseSchema),
    total: z.number().openapi({ example: 10 }),
  })
  .openapi("TourScheduleListResponse");

// Tour Schedule ID Param Schema
const tourScheduleIdParamSchema = z.object({
  tourScheduleId: z.string().openapi({
    param: {
      name: "tourScheduleId",
      in: "path",
    },
    example: "schedule_123abc",
  }),
});

// Query Schema for filtering
const tourScheduleQuerySchema = z.object({
  tourId: z.string().optional().openapi({
    example: "tour_123abc",
    description: "Filter by tour ID",
  }),
  isActive: z.enum(["true", "false"]).optional().openapi({
    example: "true",
    description: "Filter by active status",
  }),
  startDate: z.string().optional().openapi({
    example: "2024-06-15",
    description: "Filter schedules starting from this date",
    format: "date",
  }),
  endDate: z.string().optional().openapi({
    example: "2024-12-31",
    description: "Filter schedules ending before this date",
    format: "date",
  }),
  minPrice: z.coerce.number().optional().openapi({
    example: 1000,
    description: "Minimum price filter",
  }),
  maxPrice: z.coerce.number().optional().openapi({
    example: 5000,
    description: "Maximum price filter",
  }),
  availableSeatsMin: z.coerce.number().optional().openapi({
    example: 5,
    description: "Minimum available seats",
  }),
  page: z.coerce.number().optional().default(1).openapi({
    example: 1,
    description: "Page number for pagination",
  }),
  limit: z.coerce.number().optional().default(10).openapi({
    example: 10,
    description: "Number of items per page",
  }),
  sortBy: z.string().optional().openapi({
    example: "startDate",
    description: "Sort by field",
  }),
  sortOrder: z.string().optional().default("asc").openapi({
    example: "asc",
    description: "Sort order",
  }),
});

type getTourSchedulesQuerySchema = z.infer<typeof tourScheduleQuerySchema>;

// Available Schedules Query Schema
const availableSchedulesQuerySchema = z.object({
  startDate: z.string().optional().openapi({
    example: "2024-06-15",
    description: "Filter available schedules from this date",
    format: "date",
  }),
  minSeats: z.coerce.number().optional().default(1).openapi({
    example: 2,
    description: "Minimum required available seats",
  }),
});

export {
  createTourScheduleSchema,
  updateTourScheduleSchema,
  tourScheduleResponseSchema,
  tourScheduleListResponseSchema,
  tourScheduleIdParamSchema,
  tourScheduleQuerySchema,
  getTourSchedulesQuerySchema,
  availableSchedulesQuerySchema,
};
