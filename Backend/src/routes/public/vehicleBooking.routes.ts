import { Router } from "express";
import { createVehicleBooking, getUserVehicleBookingById, getUserVehicleBookings } from "../../controllers/vehicleBooking.controller";
import { authenticateToken } from "../../middleware/auth";
import { registerRoute } from "../../utils/openapi.utils";
import {
  BookingIdParamSchema,
  CreateVehicleBookingSchema,
  getVehicleBookingQuerySchema,
  VehicleBookingResponseSchema,
} from "../../schema/vehicleBooking.schema";
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

//  vehicle booking routes

router.post("/", authenticateToken, createVehicleBooking);

router.get("/my-booking",authenticateToken,getUserVehicleBookings)

router.get("/my-booking/:bookingId",authenticateToken,getUserVehicleBookingById)

// Swagger registration

// Create a new vehicle booking
registerRoute({
  method: "post",
  path: "/api/vehicle-booking",
  summary: "Create a new booking",
  tags: ["Vehicle Bookings"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: CreateVehicleBookingSchema } },
    },
  },
  responses: {
    201: {
      description: "Booking created successfully",
      content: { "application/json": { schema: VehicleBookingResponseSchema } },
    },
    400: errorResponse(badRequestErrorSchema, "Bad Request"),
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),
    403: errorResponse(forbiddenErrorSchema, "Forbidden"),
    409: errorResponse(conflictErrorSchema, "Conflict"),
    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get user vehicle bookings
registerRoute({
  method: "get",
  path: "/api/vehicle-booking/my-booking",
  summary: "Get user vehicle booking ",
  security: [{ bearerAuth: [] }],
  tags: ["Vehicle Bookings"],
  request: {
    query: getVehicleBookingQuerySchema,
  },
  responses: {
    200: {
      description: "Get Vehicle Bookings details",
      content: {
        "application/json": {
          schema: VehicleBookingResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),

    403: errorResponse(forbiddenErrorSchema, "Forbidden"),

    404: errorResponse(notFoundErrorSchema, "Not Found"),

    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get user vehicle booking by Id
registerRoute({
  method: "get",
  path: "/api/vehicle-booking/my-booking/{bookingId}",
  summary: "Get user vehicle booking ",
  security: [{ bearerAuth: [] }],
  tags: ["Vehicle Bookings"],
  request: {
    params: BookingIdParamSchema,
  },
  responses: {
    200: {
      description: "Get Vehicle Booking by Id",
      content: {
        "application/json": {
          schema: VehicleBookingResponseSchema,
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
