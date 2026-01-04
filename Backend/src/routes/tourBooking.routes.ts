import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createBookingSchema } from "../utils/zod";
import { cancelUserTourBooking, createTourBooking, getUserTourBookingById, getUserTourBookings } from "../controllers/tourBooking.controller";

const router = Router()

router.post("/",authenticateToken,validate(createBookingSchema),createTourBooking)
router.get("/my-booking",authenticateToken,getUserTourBookings)
router.get("/my-booking/:bookingId",authenticateToken,getUserTourBookingById)
router.patch("/my-booking/:bookingId/cancel",authenticateToken,cancelUserTourBooking)

export default router