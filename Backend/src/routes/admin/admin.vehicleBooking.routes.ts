import { Router } from "express";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
import { getAllVehicleBookings } from "../../controllers/vehicleBooking.controller";
import { registerRoute } from "../../utils/openapi.utils";
import {
  errorResponse,
  forbiddenErrorSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  unauthorizedErrorSchema,
} from "../../schema/common.schema";
import {
  GetBookingsQuerySchema,
  vehicleBookingListResponseSchema,
} from "../../schema/vehicleBooking.schema";

const router = Router();

router.use(authenticateToken, AdminOnly);

// Admin vehicle booking routes

router.get("/", getAllVehicleBookings);

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

export default router;
