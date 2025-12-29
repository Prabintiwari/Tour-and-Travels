import { Router } from "express";
import { createOrUpdateGallery, getGalleryByDestination } from "../controllers/destinationGallery.controller";

const router = Router();

router.get(
  "/destination-gallery/:destinationId", 
  getGalleryByDestination
);


export default router;
