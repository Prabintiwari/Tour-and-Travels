import { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  bookingParamsSchema,
  createBookingSchema,
  tourBookingResponseSchema,
} from "../../schema";
import {
  cancelUserTourBooking,
  createTourBooking,
  getUserTourBookingById,
  getUserTourBookings,
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
  validate.body(createBookingSchema),
  createTourBooking
);

router.get("/my-booking", authenticateToken, getUserTourBookings);

router.get(
  "/my-booking/:bookingId",
  authenticateToken,
  validate.params(bookingParamsSchema),
  getUserTourBookingById
);

router.patch(
  "/my-booking/:bookingId/cancel",
  authenticateToken,
  validate.params(bookingParamsSchema),
  cancelUserTourBooking
);

// Swagger registration

// Create a new tour booking
registerRoute({
  method: "post",
  path: "/api/tour-booking",
  summary: "Create a new booking",
  tags: ["Bookings"],
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

// Get user tour booking
registerRoute({
  method: "get",
  path: "/api/tour-booking/my-booking",
  summary: "Get user tour booking ",
  security: [{ bearerAuth: [] }],
  tags: ["Bookings"],
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

// Get user tour booking by id
registerRoute({
  method: "get",
  path: "/api/tour-booking/my-booking/{bookingId}",
  summary: "Get tour booking by Id",
  security: [{ bearerAuth: [] }],
  tags: ["Bookings"],
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
  tags: ["Bookings"],
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
