import { Router } from "express";
import { createDestination, deleteDestination, updateDestination } from "../../controllers/destination.controller";
import { destinationSchema } from "../../schema";
import { cloudinaryUpload } from "../../middleware/upload";
import { validate } from "../../middleware/validate";
import { AdminOnly, authenticateToken } from "../../middleware/auth";

const router = Router()

router.use(authenticateToken, AdminOnly);

router.post(
  "/",
  cloudinaryUpload("destination/").array("imageUrl", 5),
  validate(destinationSchema),
  createDestination
);


router.patch(
  "/:id",
  cloudinaryUpload("destination/").array("imageUrl", 5),
  validate(destinationSchema),
  updateDestination
);

router.delete("/:id", deleteDestination);

export default router