import { Router } from "express";
import { validate } from "../middleware/validate";
import { updateUserSchema } from "../schema";
import { authenticateToken } from "../middleware/auth";
import { cloudinaryUpload } from "../middleware/upload";
import {
  forgotPassword,
  resendOtp,
  resetPassword,
  updateUserDetails,
  verifyOtp,
} from "../controllers/user.controller";

const router = Router();

/**
 * @swagger
 * /api/users/update-profile/{id}:
 *   patch:
 *     summary: Update a user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserSchema'
 *     responses:
 *       201:
 *         description: user profile update successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/users/update-profile/:id",
  cloudinaryUpload("users/profile").single("profileImage"),
  authenticateToken,
  validate(updateUserSchema),
  updateUserDetails
);

/**
 * @swagger
 * /api/users/forgot-password:
 *   post:
 *     summary: Forgot password 
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Forgot password sent successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/users/resend-otp:
 *   post:
 *     summary: Resend Otp
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Otp resend successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post("/resend-otp", resendOtp);

/**
 * @swagger
 * /api/users/verify-otp:
 *   post:
 *     summary: verify Otp
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Otp verify successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post("/verify-otp", verifyOtp);

/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post("/reset-password", resetPassword);

export default router;
