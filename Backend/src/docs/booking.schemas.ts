/**
 * @swagger
 * components:
 *   schemas:
 *     CreateBookingSchema:
 *       type: object
 *       required:
 *         - tourId
 *         - scheduleId
 *         - numberOfParticipants
 *       properties:
 *         tourId:
 *           type: string
 *           minLength: 1
 *           description: ID of the tour to book
 *           example: tour123abc
 *         scheduleId:
 *           type: string
 *           minLength: 1
 *           description: ID of the specific tour schedule
 *           example: schedule456def
 *         numberOfParticipants:
 *           type: integer
 *           minimum: 1
 *           description: Number of participants for the booking
 *           example: 4
 *         needsGuide:
 *           type: boolean
 *           default: false
 *           description: Whether guide service is required
 *           example: true
 *         numberOfGuideNeeds:
 *           type: integer
 *           minimum: 1
 *           description: Number of guides needed (required when guidePricingType is PER_DAY)
 *           example: 2
 *         guidePricingType:
 *           type: string
 *           enum: [PER_DAY, PER_PERSON, PER_GROUP]
 *           description: Guide pricing type (required if needsGuide is true)
 *           example: PER_DAY
 *       description: |
 *         Validation Rules:
 *         - If needsGuide is true, guidePricingType must be provided
 *         - If guidePricingType is PER_DAY, numberOfGuideNeeds must be at least 1
 *         - For PER_PERSON or PER_GROUP pricing, numberOfGuideNeeds is optional
 *
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Booking ID
 *           example: booking789ghi
 *         userId:
 *           type: string
 *           description: ID of the user who made the booking
 *           example: user123abc
 *         tourId:
 *           type: string
 *           example: tour123abc
 *         scheduleId:
 *           type: string
 *           example: schedule456def
 *         numberOfParticipants:
 *           type: integer
 *           example: 4
 *         needsGuide:
 *           type: boolean
 *           example: true
 *         numberOfGuideNeeds:
 *           type: integer
 *           example: 2
 *         guidePricingType:
 *           type: string
 *           enum: [PER_DAY, PER_PERSON, PER_GROUP]
 *           example: PER_DAY
 *         totalPrice:
 *           type: number
 *           description: Total price of the booking
 *           example: 6200.00
 *         bookingStatus:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *           description: Current status of the booking
 *           example: CONFIRMED
 *         paymentStatus:
 *           type: string
 *           enum: [PENDING, PAID, FAILED, REFUNDED]
 *           description: Payment status
 *           example: PAID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-01T10:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-01T10:30:00.000Z
 *         tour:
 *           $ref: '#/components/schemas/Tour'
 *         schedule:
 *           $ref: '#/components/schemas/TourSchedule'
 *         user:
 *           $ref: '#/components/schemas/User'
 *
 *     BookingResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Booking created successfully
 *         booking:
 *           $ref: '#/components/schemas/Booking'
 *         paymentDetails:
 *           type: object
 *           properties:
 *             tourPrice:
 *               type: number
 *               example: 6000.00
 *             guidePrice:
 *               type: number
 *               example: 200.00
 *             totalPrice:
 *               type: number
 *               example: 6200.00
 */
