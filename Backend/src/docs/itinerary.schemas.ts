/**
 * @swagger
 * components:
 *   schemas:
 *     Activity:
 *       type: object
 *       required:
 *         - time
 *         - activity
 *         - location
 *       properties:
 *         time:
 *           type: string
 *           description: Time of the activity
 *           example: "08:00 AM"
 *         activity:
 *           type: string
 *           description: Description of the activity
 *           example: Breakfast at hotel
 *         location:
 *           type: string
 *           description: Location of the activity
 *           example: Namche Bazaar
 *     
 *     CreateItinerarySchema:
 *       type: object
 *       required:
 *         - tourId
 *         - day
 *         - title
 *       properties:
 *         tourId:
 *           type: string
 *           minLength: 1
 *           description: ID of the tour
 *           example: tour123abc
 *         day:
 *           type: integer
 *           minimum: 1
 *           description: Day number of the itinerary
 *           example: 1
 *         title:
 *           type: string
 *           minLength: 1
 *           description: Title for the day
 *           example: Arrival in Kathmandu
 *         description:
 *           type: string
 *           description: Detailed description for the day
 *           example: Arrive at Tribhuvan International Airport and transfer to hotel
 *         activities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Activity'
 *           default: []
 *           description: List of activities for the day
 *         accommodationType:
 *           type: string
 *           enum: [HOTEL, GUESTHOUSE, TEAHOUSE, CAMPING, HOMESTAY]
 *           description: Type of accommodation for the night
 *           example: HOTEL
 *         mealInclusions:
 *           type: array
 *           items:
 *             type: string
 *             enum: [BREAKFAST, LUNCH, DINNER]
 *           default: []
 *           description: Meals included for the day
 *           example: [BREAKFAST, DINNER]
 *     
 *     UpdateItinerarySchema:
 *       type: object
 *       properties:
 *         day:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         title:
 *           type: string
 *           example: Trek to Namche Bazaar
 *         description:
 *           type: string
 *           example: Trek from Lukla to Namche Bazaar
 *         activities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Activity'
 *         accommodationType:
 *           type: string
 *           enum: [HOTEL, GUESTHOUSE, TEAHOUSE, CAMPING, HOMESTAY]
 *           example: TEAHOUSE
 *         mealInclusions:
 *           type: array
 *           items:
 *             type: string
 *             enum: [BREAKFAST, LUNCH, DINNER]
 *           example: [BREAKFAST, LUNCH, DINNER]
 *       description: All fields are optional for update
 *     
 *     Itinerary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: itinerary123abc
 *         tourId:
 *           type: string
 *           example: tour123abc
 *         day:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: Arrival in Kathmandu
 *         description:
 *           type: string
 *           example: Arrive at airport and transfer to hotel
 *         activities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Activity'
 *         accommodationType:
 *           type: string
 *           enum: [HOTEL, GUESTHOUSE, TEAHOUSE, CAMPING, HOMESTAY]
 *           example: HOTEL
 *         mealInclusions:
 *           type: array
 *           items:
 *             type: string
 *             enum: [BREAKFAST, LUNCH, DINNER]
 *           example: [BREAKFAST, DINNER]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */