import { Router } from "express";
import {
  blockUser,
  getAllUsers,
  getUserById,
  updateUserRole,
} from "../controllers/admin.controller";
import { validate } from "../middleware/validate";
import { updateUserRoleSchema, updateUserSchema } from "../utils/zod";
import { AdminOnly, authenticateToken } from "../middleware/auth";
import { cloudinaryUpload } from "../middleware/upload";
import {
  updateUserDetails,
} from "../controllers/user.controller";
import { deleteUser } from "../controllers/auth.controller";

const router = Router();

// update user profile
router.patch(
  "/users/update-profile/:id",
  authenticateToken,
  AdminOnly,
  cloudinaryUpload("users/profile").single("profileImage"),
  validate(updateUserSchema),
  updateUserDetails
);
router.get("/users", authenticateToken, AdminOnly, getAllUsers);
router.get("/users/:id", authenticateToken, AdminOnly, getUserById);
router.delete("/users/delete/:id",authenticateToken, AdminOnly, deleteUser);
router.patch("/users/block/:id",authenticateToken, AdminOnly, blockUser);
router.patch("/users/:id/role",authenticateToken, AdminOnly,validate(updateUserRoleSchema), updateUserRole);


export default router;
