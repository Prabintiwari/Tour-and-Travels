import { Router } from "express";
import { updateUserDetails } from "../../controllers/user.controller";
import { updateUserRoleSchema, updateUserSchema } from "../../schema";
import { cloudinaryUpload } from "../../middleware/upload";
import { validate } from "../../middleware/validate";
import {
  blockUser,
  getAllUsers,
  getUserById,
  updateUserRole,
} from "../../controllers/admin.controller";
import { deleteUser } from "../../controllers/auth.controller";
import { AdminOnly, authenticateToken } from "../../middleware/auth";

const router = Router();

router.use(authenticateToken, AdminOnly);

router.patch(
  "/update-profile/:id",
  cloudinaryUpload("users/profile").single("profileImage"),
  validate(updateUserSchema),
  updateUserDetails
);

router.get("/", getAllUsers);

router.get("/:id", getUserById);

router.delete("/:id", deleteUser);

router.patch("/block/:id", blockUser);

router.patch("/:id/role", validate(updateUserRoleSchema), updateUserRole);

export default router;
