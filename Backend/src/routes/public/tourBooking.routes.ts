import { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createBookingSchema } from "../../schema";
import { cancelUserTourBooking, createTourBooking, getUserTourBookingById, getUserTourBookings } from "../../controllers/tourBooking.controller";

const router = Router()

/**
 * @swagger
 * /api/tour-bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingSchema'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 *       400:
 *         description: Invalid input or insufficient seats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Insufficient seats available
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tour or schedule not found
 *       422:
 *         description: Validation error
 */
router.post("/",authenticateToken,validate(createBookingSchema),createTourBooking)

/**
 * @swagger
 * /api/tour-bookings/my-bookings:
 *   get:
 *     summary: Get all bookings for the authenticated user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 */
router.get("/my-booking",authenticateToken,getUserTourBookings)
/**
 * @swagger
 * /api/tour-bookings/:bookingId:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.get("/my-booking/:bookingId",authenticateToken,getUserTourBookingById)
/**
 * @swagger
 * /api/tour-bookings/my-booking/:bookingId/cancel:
 *   patch:
 *     summary: Cancel my booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.patch("/my-booking/:bookingId/cancel",authenticateToken,cancelUserTourBooking)

export default router