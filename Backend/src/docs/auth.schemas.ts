/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterSchema:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - fullName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: user@example.com
 *         password:
 *           type: string
 *           minLength: 6
 *           maxLength: 50
 *           description: User's password (6-50 characters)
 *           example: MySecurePass123
 *         fullName:
 *           type: string
 *           minLength: 2
 *           description: User's full name
 *           example: John Doe
 *
 *     LoginSchema:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: user@example.com
 *         password:
 *           type: string
 *           minLength: 1
 *           description: User's password
 *           example: MySecurePass123
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Login successful
 *         token:
 *           type: string
 *           description: JWT authentication token
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: user123abc
 *             email:
 *               type: string
 *               example: user@example.com
 *             fullName:
 *               type: string
 *               example: John Doe
 *             role:
 *               type: string
 *               enum: [USER, ADMIN, GUIDE]
 *               example: USER
 *
 *     RegisterResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: User registered successfully. Please verify your email.
 *         userId:
 *           type: string
 *           example: user123abc
 */
