import { Router } from "express";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
import {
  bookingParamsSchema,
  bookingQuerySchema,
  bookingStatsResponseSchema,
  tourBookingListResponseSchema,
  tourBookingResponseSchema,
  updateBookingStatusSchema,
} from "../../schema";
import {
  getAdminTourBookingById,
  getAllTourBookings,
  getTourBookingStats,
  updateTourBookingStatus,
} from "../../controllers/tourBooking.controller";
import { registerRoute } from "../../utils/openapi.utils";
import {
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";
import {
  validateParams,
  validateQuery,
  validateRequest,
} from "../../middleware/validate";

const router = Router();
router.use(authenticateToken, AdminOnly);
// Admin tour booking routes

router.get("/", getAllTourBookings);

router.patch("/:bookingId", updateTourBookingStatus);

router.get("/booking-stats", getTourBookingStats);

router.get("/:bookingId", getAdminTourBookingById);

/* Swagger registration */

// Get all tour booking
registerRoute({
  method: "get",
  path: "/api/admin/tour-booking",
  summary: "List of tour booking",
  security: [{ bearerAuth: [] }],
  tags: ["Tour Bookings"],
  request: { query: bookingQuerySchema },
  responses: {
    200: {
      description: "List of tour booking",
      content: {
        "application/json": {
          schema: tourBookingListResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),

    403: errorResponse(forbiddenErrorSchema, "Forbidden"),

    404: errorResponse(notFoundErrorSchema, "Not Found"),

    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get  tours booking by id
registerRoute({
  method: "get",
  path: "/api/admin/tour-booking/{bookingId}",
  summary: "Get tour booking by id",
  security: [{ bearerAuth: [] }],
  tags: ["Tour Bookings"],
  request: { params: bookingParamsSchema },
  responses: {
    200: {
      description: "Get tour booking by id",
      content: {
        "application/json": {
          schema: tourBookingResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),

    403: errorResponse(forbiddenErrorSchema, "Forbidden"),

    404: errorResponse(notFoundErrorSchema, "Not Found"),

    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Update tours booking status by id
registerRoute({
  method: "patch",
  path: "/api/admin/tour-booking/{bookingId}",
  summary: "Update tour booking status by id",
  security: [{ bearerAuth: [] }],
  tags: ["Tour Bookings"],
  request: {
    params: bookingParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: updateBookingStatusSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Update tour booking by id",
      content: {
        "application/json": {
          schema: tourBookingResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),

    403: errorResponse(forbiddenErrorSchema, "Forbidden"),

    404: errorResponse(notFoundErrorSchema, "Not Found"),

    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get tour booking stats
registerRoute({
  method: "get",
  path: "/api/admin/tour-booking/booking-stats",
  summary: "Get tour booking statistics",
  description:
    "Returns overall booking statistics including counts by status and total revenue",
  tags: ["Tour Bookings"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Booking statistics retrieved successfully",
      content: {
        "application/json": {
          schema: bookingStatsResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

export default router;
