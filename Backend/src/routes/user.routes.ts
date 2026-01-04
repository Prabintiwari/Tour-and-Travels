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
  validate(updateUserSchema),
  updateUserDetails
);
router.patch(
  "/update-profile/:id",
  authenticateToken,
  cloudinaryUpload("users/profile").single("profileImage"),
  validate(updateUserSchema),
  updateUserDetails
);

router.post("/forgot-password", forgotPassword);
router.post("/resend-otp", resendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

export default router;
