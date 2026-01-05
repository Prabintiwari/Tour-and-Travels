import { Router } from "express";
import { AdminOnly, authenticateToken } from "../../middleware/auth";
import { cloudinaryUploadFromParams } from "../../middleware/upload";
import {
  createOrUpdateGallery,
  deleteGallery,
  removeGalleryImages,
} from "../../controllers/destinationGallery.controller";

const router = Router();
router.use(authenticateToken, AdminOnly);

router.post(
  "/:destinationId",
  cloudinaryUploadFromParams("destination/gallery", "destinationId").array(
    "imageUrl",
    10
  ),
  createOrUpdateGallery
);

router.patch("/:destinationId/images", removeGalleryImages);

router.delete("/:destinationId", deleteGallery);
export default router;
