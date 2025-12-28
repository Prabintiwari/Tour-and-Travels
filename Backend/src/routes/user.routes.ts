import { Router } from "express";
import { validate } from "../middleware/validate";
import { updateUserSchema } from "../utils/zod";
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

// update my profile
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
