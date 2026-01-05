import { Router } from "express";
import adminTourRoutes from "./admin.tour.routes";
import adminUsersRoutes from "./admin.user.routes";
import adminDestinationRoutes from "./admin.destination.routes";
import adminDestinationGalleryRoutes from "./admin.destination.gallery.routes.";
import adminItineraryRoutes from "./admin.itinerary.routes";
import adminTourScheduleRoutes from "./admin.tourSchedule.routes";

const router = Router();

router.use("/users", adminUsersRoutes);
router.use("/tour", adminTourRoutes);
router.use("/destinations", adminDestinationRoutes);
router.use("/destination-gallery", adminDestinationGalleryRoutes);
router.use("/itinerary", adminItineraryRoutes);
router.use("/tour-schedule", adminTourScheduleRoutes);

export default router;
