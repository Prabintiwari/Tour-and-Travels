import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createBookingSchema } from "../utils/zod";
import { createTourBooking, getUserTourBookingById, getUserTourBookings } from "../controllers/tourBooking.controller";

const router = Router()

router.post("/",authenticateToken,validate(createBookingSchema),createTourBooking)
router.post("/my-booking",authenticateToken,getUserTourBookings)
router.post("/my-booking/:bookingId",authenticateToken,getUserTourBookingById)

export default router