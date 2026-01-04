/**
 * @swagger
 * components:
 *   schemas:
 *     DestinationSchema:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - region
 *         - location
 *         - bestTimeToVisit
 *         - attractions
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           description: Name of the destination
 *           example: Everest Region
 *         description:
 *           type: string
 *           minLength: 10
 *           description: Detailed description of the destination
 *           example: The Everest region is home to the world's highest peak and offers stunning mountain views
 *         region:
 *           type: string
 *           minLength: 1
 *           description: Geographic region
 *           example: Khumbu
 *         location:
 *           type: string
 *           minLength: 1
 *           description: Specific location
 *           example: Solukhumbu District, Nepal
 *         bestTimeToVisit:
 *           type: string
 *           minLength: 1
 *           description: Best time to visit this destination
 *           example: March to May, September to November
 *         attractions:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *           description: List of attractions (can be sent as JSON string or array)
 *           example: ["Mount Everest", "Namche Bazaar", "Tengboche Monastery", "Kala Patthar"]
 *
 *     Destination:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: dest123abc
 *         name:
 *           type: string
 *           example: Everest Region
 *         description:
 *           type: string
 *           example: The Everest region is home to the world's highest peak
 *         region:
 *           type: string
 *           example: Khumbu
 *         location:
 *           type: string
 *           example: Solukhumbu District, Nepal
 *         bestTimeToVisit:
 *           type: string
 *           example: March to May, September to November
 *         attractions:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Mount Everest", "Namche Bazaar", "Tengboche Monastery"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-01T00:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-02T00:00:00.000Z
 */
