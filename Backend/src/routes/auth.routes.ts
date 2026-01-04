import { Router } from "express";
import { validate } from "../middleware/validate";
import { loginSchema, registerSchema } from "../schema";
import {
  deleteUser,
  getMe,
  login,
  logout,
  register,
  verifyRegistration,
} from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterSchema'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       400:
 *         description: User already exists or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User with this email already exists
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: email
 *                       message:
 *                         type: string
 *                         example: Invalid email format
 */
router.post("/register", validate(registerSchema), register);

/**
 * @swagger
 * /api/auth/verify-register:
 *   post:
 *     summary: Verify user registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired verification token
 */
router.post("/verify-register", verifyRegistration);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginSchema'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid email or password
 *       422:
 *         description: Validation error
 */
router.post("/login", validate(loginSchema), login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized - token missing or invalid
 */
router.post("/logout", authenticateToken, logout);

/**
 * @swagger
 * /api/auth/my-profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized - token missing or invalid
 */
router.get("/my-profile", authenticateToken, getMe);

/**
 * @swagger
 * /api/auth/delete/{id}:
 *   delete:
 *     summary: Delete user account
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to delete
 *     responses:
 *       200:
 *         description: User account deleted successfully
 *       401:
 *         description: Unauthorized - token missing or invalid
 *       404:
 *         description: User not found
 */
router.delete("/delete/:id", authenticateToken, deleteUser);

export default router;
