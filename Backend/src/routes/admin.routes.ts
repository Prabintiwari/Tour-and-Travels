import { Router } from "express";
import {
  blockUser,
  getAllUsers,
  getUserById,
  updateUserRole,
} from "../controllers/admin.controller";
import { validate } from "../middleware/validate";
import {
  createTourSchema,
  destinationSchema,
  updateUserRoleSchema,
  updateUserSchema,
} from "../utils/zod";
import { AdminOnly, authenticateToken } from "../middleware/auth";
import {
  cloudinaryUpload,
  cloudinaryUploadFromParams,
} from "../middleware/upload";
import { updateUserDetails } from "../controllers/user.controller";
import { deleteUser } from "../controllers/auth.controller";
import {
  createDestination,
  deleteDestination,
  updateDestination,
} from "../controllers/destination.controller";
import {
  createOrUpdateGallery,
  deleteGallery,
  removeGalleryImages,
} from "../controllers/destinationGallery.controller";
import { addTourImages, createTour } from "../controllers/tour.controller";

const router = Router();

router.use(authenticateToken, AdminOnly);

// user API
router.patch(
  "/users/update-profile/:id",
  cloudinaryUpload("users/profile").single("profileImage"),
  validate(updateUserSchema),
  updateUserDetails
);
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.delete("/users/:id", deleteUser);
router.patch("/users/block/:id", blockUser);
router.patch("/users/:id/role", validate(updateUserRoleSchema), updateUserRole);

// Destination API
router.post(
  "/destinations",
  cloudinaryUpload("destination/").array("imageUrl", 5),
  validate(destinationSchema),
  createDestination
);

router.post(
  "/destinations/:id",
  cloudinaryUpload("destination/").array("imageUrl", 5),
  validate(destinationSchema),
  updateDestination
);

router.delete("/destinations/:id", deleteDestination);

// Destination Gallery API
router.post(
  "/destination-gallery/:destinationId",
  cloudinaryUploadFromParams("destination/gallery", "destinationId").array(
    "imageUrl",
    10
  ),
  createOrUpdateGallery
);

router.patch("/destination-gallery/:destinationId/images", removeGalleryImages);

router.delete("/destination-gallery/:destinationId", deleteGallery);

// Tour API
router.post("/tour", validate(createTourSchema), createTour);

router.post(
  "/tour/:tourId",
  cloudinaryUploadFromParams("tour", "tourId").array("imageUrl", 10),
  addTourImages
);

export default router;
