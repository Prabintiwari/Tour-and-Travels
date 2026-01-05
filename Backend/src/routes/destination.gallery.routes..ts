import { Router } from "express";
import {
  getAllGalleries,
  getGalleryByDestination,
} from "../controllers/destinationGallery.controller";

const router = Router();

/**
 * @swagger
 * /api/destination-gallery:
 *   get:
 *     summary: Retrieve all galleries
 *     description: Fetches all available destination galleries
 *     responses:
 *       200:
 *         description: Successfully retrieved all galleries
 */
router.get("/", getAllGalleries);

/**
 * @swagger
 * /api/destination-gallery/{destinationId}:
 *   get:
 *     summary: Retrieve gallery by destination ID
 *     description: Fetches gallery collection for a specific destination
 *     parameters:
 *       - in: path
 *         name: destinationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the destination
 *     responses:
 *       200:
 *         description: Successfully retrieved destination gallery
 *       404:
 *         description: Destination gallery not found
 */
router.get("/:destinationId", getGalleryByDestination);

export default router;
