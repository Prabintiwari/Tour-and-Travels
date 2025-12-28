import { Router } from "express";
import {
  blockUser,
  getAllUsers,
  getUserById,
  updateUserRole,
} from "../controllers/admin.controller";
import { validate } from "../middleware/validate";
import { destinationSchema, updateUserRoleSchema, updateUserSchema } from "../utils/zod";
import { AdminOnly, authenticateToken } from "../middleware/auth";
import { cloudinaryUpload } from "../middleware/upload";
import {
  updateUserDetails,
} from "../controllers/user.controller";
import { deleteUser } from "../controllers/auth.controller";
import { createDestination, deleteDestination, updateDestination } from "../controllers/destination.controller";

const router = Router();

// user API
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

// Destination API
router.post("/destinations",authenticateToken,AdminOnly,cloudinaryUpload("destination/").array("imageUrl",5),validate(destinationSchema),createDestination)

router.post("/destinations/update/:id",authenticateToken,AdminOnly,cloudinaryUpload("destination/").array("imageUrl",5),validate(destinationSchema),updateDestination)

router.delete('/destinations/delete/:id',authenticateToken,AdminOnly,deleteDestination)

export default router;
