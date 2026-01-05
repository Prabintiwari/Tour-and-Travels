import { Router } from "express";
import { getCompleteItinerary, getItinerariesByTour, getItineraryById } from "../../controllers/itinerary.controller";

const router = Router()

router.get("/",getCompleteItinerary)
router.get("/:itineraryId",getItineraryById)
router.get("/tour/:tourId",getItinerariesByTour)


export default router