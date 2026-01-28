import { Router } from "express";
import adminTourRoutes from "./admin.tour.routes";
import adminUsersRoutes from "./admin.user.routes";
import adminDestinationRoutes from "./admin.destination.routes";
import adminDestinationGalleryRoutes from "./admin.destination.gallery.routes.";
import adminItineraryRoutes from "./admin.itinerary.routes";
import adminTourScheduleRoutes from "./admin.tourSchedule.routes";
import adminTourBookingRoutes from "./admin.tourBooking.routes";
import adminTourReviewRoutes from "./admin.tourReview.routes";
import adminFAQRoutes from "./admin.tourFAQ.routes";
import adminCustomItineraryRoutes from "./admin.customItinerary.routes";
import adminVehicleRoutes from "./admin.vehicle.routes";
import adminVehicleBookingRoutes from "./admin.vehicleBooking.routes";
import adminVehicleReviewRoutes from "./admin.vehicleReview.routes";

const router = Router();

router.use("/users", adminUsersRoutes);
router.use("/tour", adminTourRoutes);
router.use("/destinations", adminDestinationRoutes);
router.use("/destination-gallery", adminDestinationGalleryRoutes);
router.use("/itinerary", adminItineraryRoutes);
router.use("/tour-schedule", adminTourScheduleRoutes);
router.use("/tour-booking", adminTourBookingRoutes);
router.use("/tour-review", adminTourReviewRoutes);
router.use("/faqs", adminFAQRoutes);
router.use("/custom-itinerary", adminCustomItineraryRoutes);
router.use("/vehicle", adminVehicleRoutes);
router.use("/vehicle-booking", adminVehicleBookingRoutes);
router.use("/vehicle-review", adminVehicleReviewRoutes);

export default router;
