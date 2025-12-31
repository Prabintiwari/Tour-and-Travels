import { Router } from "express";
import { getAllTours, getDefaultGuidePricing, getGuidePricingForTour, getTourById } from "../controllers/tour.controller";

const router = Router();

router.get("/",getAllTours)
router.get("/guide-pricing/default", getDefaultGuidePricing);
router.get("/:tourId/guide-pricing", getGuidePricingForTour);
router.get("/:tourId",getTourById)

export default router;
