/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateUserSchema:
 *       type: object
 *       required:
 *         - fullName
 *       properties:
 *         fullName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: User's full name
 *           example: John Doe
 *         phone:
 *           type: string
 *           pattern: '^[0-9]{7,15}$'
 *           description: Phone number (7-15 digits)
 *           example: "9876543210"
 *         profileImage:
 *           type: string
 *           format: uri
 *           description: URL to profile image
 *           example: https://example.com/images/profile.jpg
 *         address:
 *           type: string
 *           description: Full address
 *           example: Thamel, Kathmandu
 *         street:
 *           type: string
 *           description: Street address
 *           example: Thamel Marg
 *         city:
 *           type: string
 *           description: City name
 *           example: Kathmandu
 *         country:
 *           type: string
 *           description: Country name
 *           example: Nepal
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *           description: Date of birth in YYYY-MM-DD format
 *           example: "1990-01-15"
 *     
 *     UpdateUserRoleSchema:
 *       type: object
 *       required:
 *         - role
 *       properties:
 *         role:
 *           type: string
 *           enum: [USER, ADMIN, GUEST]
 *           description: User role
 *           example: USER
 *     
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: user123abc
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         fullName:
 *           type: string
 *           example: John Doe
 *         phone:
 *           type: string
 *           example: "9876543210"
 *         profileImage:
 *           type: string
 *           example: https://example.com/images/profile.jpg
 *         address:
 *           type: string
 *           example: Thamel, Kathmandu
 *         street:
 *           type: string
 *           example: Thamel Marg
 *         city:
 *           type: string
 *           example: Kathmandu
 *         country:
 *           type: string
 *           example: Nepal
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           example: "1990-01-15"
 *         role:
 *           type: string
 *           enum: [USER, ADMIN, GUEST]
 *           example: USER
 *         isVerified:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */