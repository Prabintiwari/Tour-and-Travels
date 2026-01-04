/**
 * @swagger
 * components:
 *   schemas:
 *     CreateTourSchema:
 *       type: object
 *       required:
 *         - destinationId
 *         - title
 *         - description
 *         - numberOfDays
 *         - basePrice
 *       properties:
 *         destinationId:
 *           type: string
 *           description: ID of the destination
 *           example: dest123abc
 *         title:
 *           type: string
 *           minLength: 1
 *           description: Tour title
 *           example: Everest Base Camp Trek
 *         description:
 *           type: string
 *           minLength: 10
 *           description: Detailed tour description
 *           example: An amazing 14-day trek to the base of Mount Everest with experienced guides
 *         numberOfDays:
 *           type: integer
 *           minimum: 1
 *           description: Duration of the tour in days
 *           example: 14
 *         basePrice:
 *           type: number
 *           minimum: 0
 *           description: Base price of the tour
 *           example: 1500.00
 *         discountRate:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Discount percentage (0-100)
 *           example: 10
 *         discountAmount:
 *           type: number
 *           minimum: 0
 *           description: Fixed discount amount
 *           example: 150.00
 *         discountActive:
 *           type: boolean
 *           default: false
 *           description: Whether discount is currently active
 *           example: true
 *         maxParticipants:
 *           type: integer
 *           minimum: 1
 *           description: Maximum number of participants allowed
 *           example: 15
 *         minParticipants:
 *           type: integer
 *           minimum: 1
 *           description: Minimum number of participants required
 *           example: 2
 *         difficultyLevel:
 *           type: string
 *           enum: [EASY, MODERATE, DIFFICULT]
 *           description: Difficulty level of the tour
 *           example: MODERATE
 *         isFeatured:
 *           type: boolean
 *           default: false
 *           description: Whether tour is featured on homepage
 *           example: true
 *         guidePricePerDay:
 *           type: number
 *           minimum: 0
 *           description: Guide price per day
 *           example: 50.00
 *         guidePricePerPerson:
 *           type: number
 *           minimum: 0
 *           description: Guide price per person
 *           example: 30.00
 *         guidePricePerGroup:
 *           type: number
 *           minimum: 0
 *           description: Guide price per group
 *           example: 200.00
 *         guideMinimumCharge:
 *           type: number
 *           minimum: 0
 *           description: Minimum charge for guide service
 *           example: 100.00
 *         guideMaximumGroupSize:
 *           type: integer
 *           minimum: 1
 *           description: Maximum group size for guide service
 *           example: 10
 *         guideDescription:
 *           type: string
 *           minLength: 5
 *           description: Description of guide service
 *           example: Experienced local guides with 10+ years of trekking expertise
 *       description: |
 *         Notes:
 *         - At least one guide pricing option (guidePricePerDay, guidePricePerPerson, or guidePricePerGroup) must be provided
 *         - If discountActive is true, either discountRate OR discountAmount must be provided (not both)
 *         - minParticipants must be less than or equal to maxParticipants
 *
 *     UpdateTourSchema:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           description: Tour title
 *           example: Everest Base Camp Trek - Updated
 *         description:
 *           type: string
 *           minLength: 10
 *           description: Detailed tour description
 *           example: An updated amazing trek description
 *         numberOfDays:
 *           type: integer
 *           minimum: 1
 *           description: Duration of the tour in days
 *           example: 14
 *         basePrice:
 *           type: number
 *           minimum: 0
 *           description: Base price of the tour
 *           example: 1600.00
 *         discountRate:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Discount percentage (0-100)
 *           example: 15
 *         discountAmount:
 *           type: number
 *           minimum: 0
 *           description: Fixed discount amount
 *           example: 200.00
 *         discountActive:
 *           type: boolean
 *           default: false
 *           description: Whether discount is currently active
 *           example: false
 *         maxParticipants:
 *           type: integer
 *           minimum: 1
 *           description: Maximum number of participants allowed
 *           example: 20
 *         minParticipants:
 *           type: integer
 *           minimum: 1
 *           description: Minimum number of participants required
 *           example: 3
 *         difficultyLevel:
 *           type: string
 *           enum: [EASY, MODERATE, CHALLENGING, DIFFICULT]
 *           description: Difficulty level of the tour
 *           example: MODERATE
 *         isFeatured:
 *           type: boolean
 *           default: false
 *           description: Whether tour is featured on homepage
 *           example: false
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether tour is active and bookable
 *           example: true
 *         guidePricePerDay:
 *           type: number
 *           minimum: 0
 *           description: Guide price per day
 *           example: 55.00
 *         guidePricePerPerson:
 *           type: number
 *           minimum: 0
 *           description: Guide price per person
 *           example: 35.00
 *         guidePricePerGroup:
 *           type: number
 *           minimum: 0
 *           description: Guide price per group
 *           example: 250.00
 *         guideMinimumCharge:
 *           type: number
 *           minimum: 0
 *           description: Minimum charge for guide service
 *           example: 120.00
 *         guideMaximumGroupSize:
 *           type: integer
 *           minimum: 1
 *           description: Maximum group size for guide service
 *           example: 12
 *         guideDescription:
 *           type: string
 *           minLength: 5
 *           description: Description of guide service
 *           example: Updated guide service description
 *       description: All fields are optional for update
 *
 *     DefaultGuidePricingSchema:
 *       type: object
 *       properties:
 *         pricePerDay:
 *           type: number
 *           minimum: 0
 *           description: Default price per day for guide service
 *           example: 50.00
 *         pricePerPerson:
 *           type: number
 *           minimum: 0
 *           description: Default price per person for guide service
 *           example: 30.00
 *         pricePerGroup:
 *           type: number
 *           minimum: 0
 *           description: Default price per group for guide service
 *           example: 200.00
 *         minimumCharge:
 *           type: number
 *           minimum: 0
 *           description: Minimum charge for guide service
 *           example: 100.00
 *         maximumGroupSize:
 *           type: integer
 *           minimum: 1
 *           description: Maximum group size for guide service
 *           example: 10
 *         description:
 *           type: string
 *           minLength: 5
 *           description: Description of default guide pricing
 *           example: Standard guide pricing for all tours
 *       description: |
 *         Notes:
 *         - At least one pricing option (pricePerDay, pricePerPerson, or pricePerGroup) is required
 *         - No additional properties allowed (strict mode)
 *
 *     Tour:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Tour ID
 *           example: tour123abc
 *         destinationId:
 *           type: string
 *           description: Destination ID
 *           example: dest123abc
 *         title:
 *           type: string
 *           example: Everest Base Camp Trek
 *         description:
 *           type: string
 *           example: An amazing 14-day trek to the base of Mount Everest
 *         numberOfDays:
 *           type: integer
 *           example: 14
 *         basePrice:
 *           type: number
 *           example: 1500.00
 *         discountRate:
 *           type: number
 *           example: 10
 *         discountAmount:
 *           type: number
 *           example: 150.00
 *         discountActive:
 *           type: boolean
 *           example: true
 *         finalPrice:
 *           type: number
 *           description: Calculated final price after discount
 *           example: 1350.00
 *         maxParticipants:
 *           type: integer
 *           example: 15
 *         minParticipants:
 *           type: integer
 *           example: 2
 *         difficultyLevel:
 *           type: string
 *           enum: [EASY, MODERATE, CHALLENGING, DIFFICULT]
 *           example: CHALLENGING
 *         isFeatured:
 *           type: boolean
 *           example: true
 *         isActive:
 *           type: boolean
 *           example: true
 *         guidePricePerDay:
 *           type: number
 *           example: 50.00
 *         guidePricePerPerson:
 *           type: number
 *           example: 30.00
 *         guidePricePerGroup:
 *           type: number
 *           example: 200.00
 *         guideMinimumCharge:
 *           type: number
 *           example: 100.00
 *         guideMaximumGroupSize:
 *           type: integer
 *           example: 10
 *         guideDescription:
 *           type: string
 *           example: Experienced local guides
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-01T00:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-02T00:00:00.000Z
 *         destination:
 *           $ref: '#/components/schemas/Destination'
 */
