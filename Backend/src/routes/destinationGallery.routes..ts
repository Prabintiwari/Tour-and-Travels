import { Router } from "express";
import { AdminOnly, authenticateToken } from "../middleware/auth";
import { cloudinaryUpload } from "../middleware/upload";
import { createOrUpdateGallery } from "../controllers/destinationGallery.controller";

const router = Router();
router.post(
  "/:destinationId",
  authenticateToken,
  AdminOnly,
  cloudinaryUpload("destination/").array("imageUrl",10), 
  createOrUpdateGallery
);


export default router;
