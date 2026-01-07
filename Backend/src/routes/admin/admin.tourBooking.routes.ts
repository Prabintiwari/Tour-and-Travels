import { Router } from "express";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { bookingQuerySchema, tourBookingListResponseSchema } from "../../schema";
import { getAllTourBookings } from "../../controllers/tourBooking.controller";
import { registerRoute } from "../../utils/openapi.utils";
import { errorResponse, forbiddenErrorSchema, internalServerErrorSchema, notFoundErrorSchema, unauthorizedErrorSchema } from "../../schema/common.schema";

const router = Router();
router.use(authenticateToken, AdminOnly);
// Admin tour booking routes

// Get all tour booking
router.get("/", validate.query(bookingQuerySchema), getAllTourBookings);

/* Swagger registration */

// Get all tours
registerRoute({
  method: "get",
  path: "/api/admin/tour-booking",
  summary: "List of tour booking",
  security: [{ bearerAuth: [] }],
  tags: ["Bookings"],
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
export default router;
