import { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import {
  bookingParamsSchema,
  createBookingSchema,
  getBookingQuerySchema,
  rescheduleBookingSchema,
  tourBookingResponseSchema,
  updateBookingSchema,
} from "../../schema";
import {
  cancelUserTourBooking,
  createTourBooking,
  getUserTourBookingById,
  getUserTourBookings,
  rescheduleTourBooking,
  updateTourBooking,
} from "../../controllers/tourBooking.controller";
import { registerRoute } from "../../utils/openapi.utils";
import {
  badRequestErrorSchema,
  conflictErrorSchema,
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";

const router = Router();

// Tour booking routes
router.post(
  "/",
  authenticateToken,
  createTourBooking
);

router.patch(
  "/my-booking/:bookingId/reschedule",
  authenticateToken,
  rescheduleTourBooking
);

router.patch(
  "/my-booking/:bookingId",
  authenticateToken,
  updateTourBooking
);

router.get("/my-booking", authenticateToken, getUserTourBookings);

router.patch(
  "/my-booking/:bookingId/cancel",
  authenticateToken,
  cancelUserTourBooking
);

router.get(
  "/my-booking/:bookingId",
  authenticateToken,
  getUserTourBookingById
);

// Swagger registration

// Create a new tour booking
registerRoute({
  method: "post",
  path: "/api/tour-booking",
  summary: "Create a new booking",
  tags: ["Tour Bookings"],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createBookingSchema } } },
  },
  responses: {
    201: {
      description: "Booking created successfully",
      content: { "application/json": { schema: tourBookingResponseSchema } },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Reschedule a user tour booking
registerRoute({
  method: "patch",
  path: "/api/tour-booking/my-booking/{bookingId}/reschedule",
  summary: "reschedule a user tour booking",
  tags: ["Tour Bookings"],
  security: [{ bearerAuth: [] }],
  request: {
    params: bookingParamsSchema,
    body: {
      content: { "application/json": { schema: rescheduleBookingSchema } },
    },
  },
  responses: {
    201: {
      description: "Booking updated successfully",
      content: { "application/json": { schema: tourBookingResponseSchema } },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Update a tour booking
registerRoute({
  method: "patch",
  path: "/api/tour-booking/my-booking/{bookingId}",
  summary: "Update a user tour booking",
  tags: ["Tour Bookings"],
  security: [{ bearerAuth: [] }],
  request: {
    params: bookingParamsSchema,
    body: {
      content: { "application/json": { schema: updateBookingSchema } },
    },
  },
  responses: {
    201: {
      description: "Booking updated successfully",
      content: { "application/json": { schema: tourBookingResponseSchema } },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get user tour booking
registerRoute({
  method: "get",
  path: "/api/tour-booking/my-booking",
  summary: "Get user tour booking ",
  security: [{ bearerAuth: [] }],
  tags: ["Tour Bookings"],
  request: {
    query: getBookingQuerySchema,
  },
  responses: {
    200: {
      description: "Tour bookings details",
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

// Get user tour booking by id
registerRoute({
  method: "get",
  path: "/api/tour-booking/my-booking/{bookingId}",
  summary: "Get tour booking by Id",
  security: [{ bearerAuth: [] }],
  tags: ["Tour Bookings"],
  request: {
    params: bookingParamsSchema,
  },
  responses: {
    200: {
      description: "Tour bookings details",
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

// Cancel user tour booking by id
registerRoute({
  method: "patch",
  path: "/api/tour-booking/my-booking/{bookingId}/cancel",
  summary: "Cancel tour booking by Id",
  tags: ["Tour Bookings"],
  security: [{ bearerAuth: [] }],
  request: {
    params: bookingParamsSchema,
  },
  responses: {
    200: {
      description: "Cancel Tour bookings",
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

export default router;
