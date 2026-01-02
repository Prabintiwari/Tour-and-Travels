import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createBookingSchema } from "../utils/zod";
import { createTourBooking } from "../controllers/tourBooking.controller";

const router = Router()

router.post("/",authenticateToken,validate(createBookingSchema),createTourBooking)

export default router