import { Router } from "express";
import {
  getAllGalleries,
  getGalleryByDestination,
} from "../controllers/destinationGallery.controller";

const router = Router();
router.get("/", getAllGalleries);

router.get("/:destinationId", getGalleryByDestination);



export default router;
