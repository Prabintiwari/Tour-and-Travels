import { Router } from "express";
import {
  addActivity,
  createItinerary,
  deleteItinerary,
  removeActivity,
  updateItinerary,
} from "../../controllers/itinerary.controller";
import { createItinerarySchema, updateItinerarySchema } from "../../schema";
import { validate } from "../../middleware/validate";
import { AdminOnly, authenticateToken } from "../../middleware/auth";

const router = Router();
router.use(authenticateToken, AdminOnly);

router.post("/", validate(createItinerarySchema), createItinerary);
router.patch(
  "/:itineraryId",
  validate(updateItinerarySchema),
  updateItinerary
);

router.delete("/:itineraryId", deleteItinerary);

router.patch("/:itineraryId/add-activities", addActivity);

router.delete("/:itineraryId/remove-activities", removeActivity);
export default router;
