/**
 * @swagger
 * components:
 *   schemas:
 *     CreateTourScheduleSchema:
 *       type: object
 *       required:
 *         - tourId
 *         - title
 *         - description
 *         - startDate
 *         - endDate
 *         - availableSeats
 *         - price
 *       properties:
 *         tourId:
 *           type: string
 *           minLength: 1
 *           description: ID of the tour
 *           example: tour123abc
 *         title:
 *           type: string
 *           minLength: 1
 *           description: Schedule title
 *           example: Everest Trek - Spring 2024
 *         description:
 *           type: string
 *           minLength: 10
 *           description: Schedule description
 *           example: Join us for an amazing spring trek to Everest Base Camp
 *         startDate:
 *           type: string
 *           format: date
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *           description: Start date in YYYY-MM-DD format (cannot be in the past)
 *           example: "2024-03-15"
 *         endDate:
 *           type: string
 *           format: date
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *           description: End date in YYYY-MM-DD format (must be after start date, cannot be in the past)
 *           example: "2024-03-29"
 *         availableSeats:
 *           type: integer
 *           minimum: 1
 *           description: Number of available seats
 *           example: 15
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Price for this schedule
 *           example: 1500.00
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether this schedule is active
 *           example: true
 *       description: |
 *         Validation Rules:
 *         - Start date cannot be in the past
 *         - End date cannot be in the past
 *         - End date must be after start date
 *     
 *     UpdateTourScheduleSchema:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: Everest Trek - Spring 2024 (Updated)
 *         description:
 *           type: string
 *           minLength: 10
 *           example: Updated description
 *         startDate:
 *           type: string
 *           format: date
 *           example: "2024-03-20"
 *         endDate:
 *           type: string
 *           format: date
 *           example: "2024-04-03"
 *         availableSeats:
 *           type: integer
 *           minimum: 1
 *           example: 20
 *         price:
 *           type: number
 *           minimum: 0
 *           example: 1600.00
 *         isActive:
 *           type: boolean
 *           example: true
 *         currentBookings:
 *           type: integer
 *           minimum: 0
 *           description: Current number of bookings
 *           example: 5
 *       description: All fields are optional for update
 *     
 *     TourSchedule:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: schedule123abc
 *         tourId:
 *           type: string
 *           example: tour123abc
 *         title:
 *           type: string
 *           example: Everest Trek - Spring 2024
 *         description:
 *           type: string
 *           example: Join us for an amazing spring trek
 *         startDate:
 *           type: string
 *           format: date-time
 *           example: "2024-03-15T00:00:00.000Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           example: "2024-03-29T00:00:00.000Z"
 *         availableSeats:
 *           type: integer
 *           example: 15
 *         currentBookings:
 *           type: integer
 *           example: 5
 *         price:
 *           type: number
 *           example: 1500.00
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         tour:
 *           $ref: '#/components/schemas/Tour'
 */