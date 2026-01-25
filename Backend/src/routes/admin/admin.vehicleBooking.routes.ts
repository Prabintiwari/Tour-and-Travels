import { Router } from "express";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
import { getAllVehicleBookings, updateVehicleBookingBookingStatus } from "../../controllers/vehicleBooking.controller";
import { registerRoute } from "../../utils/openapi.utils";
import {
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";
import {
    BookingIdParamSchema,
  GetBookingsQuerySchema,
  updateVehicleBookingStatusSchema,
  vehicleBookingListResponseSchema,
  VehicleBookingResponseSchema,
} from "../../schema"

const router = Router();

router.use(authenticateToken, AdminOnly);

// Admin vehicle booking routes

router.get("/", getAllVehicleBookings);

router.patch("/:bookingId/status", updateVehicleBookingBookingStatus);

router.get("/:bookingId", getAllVehicleBookings);

// Swagger registration

// Get all vehicle booking
registerRoute({
  method: "get",
  path: "/api/admin/vehicle-booking",
  summary: "List of vehicle booking",
  security: [{ bearerAuth: [] }],
  tags: ["Vehicle Bookings"],
  request: { query: GetBookingsQuerySchema },
  responses: {
    200: {
      description: "List of vehicle booking",
      content: {
        "application/json": {
          schema: vehicleBookingListResponseSchema,
        },
      },
    },
    401: errorResponse(unauthorizedErrorSchema, "Unauthorized"),

    403: errorResponse(forbiddenErrorSchema, "Forbidden"),

    404: errorResponse(notFoundErrorSchema, "Booking Not Found"),

    500: errorResponse(internalServerErrorSchema, "Internal Server Error"),
  },
});

// Get  vehicle booking by id
registerRoute({
  method: "get",
  path: "/api/admin/vehicle-booking/{bookingId}",
  summary: "Get vehicle booking by id",
  security: [{ bearerAuth: [] }],
  tags: ["Vehicle Bookings"],
  request: { params: BookingIdParamSchema },
  responses: {
    200: {
      description: "Get tour booking by id",
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

// Update Vehicle booking status by id
registerRoute({
  method: "patch",
  path: "/api/admin/vehicle-booking/{bookingId}/status",
  summary: "Update Vehicle booking status by id",
  security: [{ bearerAuth: [] }],
  tags: ["Vehicle Bookings"],
  request: {
    params: BookingIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: updateVehicleBookingStatusSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Update Vehicle booking by id",
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
