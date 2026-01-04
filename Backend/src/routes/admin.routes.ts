import { Router } from "express";
import {
  blockUser,
  getAllUsers,
  getUserById,
  updateUserRole,
} from "../controllers/admin.controller";
import { validate } from "../middleware/validate";

import {
  destinationSchema,
  updateUserRoleSchema,
  updateUserSchema,
  createTourSchema,
  updateTourSchema,
  defaultGuidePricingSchema,
  updateItinerarySchema,
  createItinerarySchema,
  createTourScheduleSchema,
  updateTourScheduleSchema,
} from "../schema";
import { AdminOnly, authenticateToken } from "../middleware/auth";
import {
  cloudinaryUpload,
  cloudinaryUploadFromParams,
} from "../middleware/upload";
import { updateUserDetails } from "../controllers/user.controller";
import { deleteUser } from "../controllers/auth.controller";
import {
  createDestination,
  deleteDestination,
  updateDestination,
} from "../controllers/destination.controller";
import {
  createOrUpdateGallery,
  deleteGallery,
  removeGalleryImages,
} from "../controllers/destinationGallery.controller";
import {
  addTourImages,
  createTour,
  deleteTour,
  deleteTourGuidePricing,
  removeTourImages,
  setDefaultGuidePricing,
  updateTour,
} from "../controllers/tour.controller";
import {
  addActivity,
  createItinerary,
  deleteItinerary,
  removeActivity,
  updateItinerary,
} from "../controllers/itinerary.controller";
import {
  createTourSchedule,
  deleteTourSchedule,
  updateTourSchedule,
} from "../controllers/tourSchedule.controller";

const router = Router();

router.use(authenticateToken, AdminOnly);

// user API

/**
 * @swagger
 * /api/admin/users/update-profile/{id}:
 *   patch:
 *     summary: Update a user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserSchema'
 *     responses:
 *       201:
 *         description: user profile update successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/users/update-profile/:id",
  cloudinaryUpload("users/profile").single("profileImage"),
  validate(updateUserSchema),
  updateUserDetails
);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Get all users successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Users not found
 */
router.get("/users", getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get users By Id
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Get user successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get("/users/:id", getUserById);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user By Id
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.delete("/users/:id", deleteUser);
/**
 * @swagger
 * /api/admin/users/block/{id}:
 *   delete:
 *     summary: Block user By Id
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User blocked successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.patch("/users/block/:id", blockUser);

/**
 * @swagger
 * /api/admin/users/users/{id}/role:
 *   patch:
 *     summary: Update a user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRoleSchema'
 *     responses:
 *       201:
 *         description: user profile update successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.patch("/users/:id/role", validate(updateUserRoleSchema), updateUserRole);

// Destination API
/**
 * @swagger
 * /api/admin/destinations:
 *   post:
 *     summary: Create a new destination
 *     tags: [Destinations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/DestinationSchema'
 *     responses:
 *       201:
 *         description: Destination created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Destination'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/destinations",
  cloudinaryUpload("destination/").array("imageUrl", 5),
  validate(destinationSchema),
  createDestination
);

/**
 * @swagger
 * /api/admin/destinations/{id}:
 *   patch:
 *     summary: Update  destination
 *     tags: [Destinations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/DestinationSchema'
 *     responses:
 *       201:
 *         description: Destination updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Destination'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/destinations/:id",
  cloudinaryUpload("destination/").array("imageUrl", 5),
  validate(destinationSchema),
  updateDestination
);

/**
 * @swagger
 * /api/admin/destinations/{id}:
 *   delete:
 *     summary: Delete destination
 *     tags: [Destinations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Destination deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Destination not found
 */

router.delete("/destinations/:id", deleteDestination);

// Destination Gallery API

/**
 * @swagger
 * /api/admin/destination-gallery/{destinationId}:
 *   post:
 *     summary: Create or Update destination-gallery
 *     tags: [Destination-gallery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Destination-gallery created or Updated successfully
 *       401:
 *         description: Invalid input
 *       404:
 *         description: Unauthorized
 */
router.post(
  "/destination-gallery/:destinationId",
  cloudinaryUploadFromParams("destination/gallery", "destinationId").array(
    "imageUrl",
    10
  ),
  createOrUpdateGallery
);

/**
 * @swagger
 * /api/admin/destination-gallery/{destinationId}/images:
 *   patch:
 *     summary: Remove Gallery Images
 *     tags: [Destination-gallery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Destination-gallery images removed successfully
 *       401:
 *         description: Invalid input
 *       404:
 *         description: Unauthorized
 */

router.patch("/destination-gallery/:destinationId/images", removeGalleryImages);

/**
 * @swagger
 * /api/admin/destination-gallery/{destinationId}:
 *   delete:
 *     summary: Delete destination-gallery
 *     tags: [Destination-gallery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Destination-gallery deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Destination-gallery not found
 */
router.delete("/destination-gallery/:destinationId", deleteGallery);

/**
 * @swagger
 * /api/admin/tour/guide-pricing/default:
 *   patch:
 *     summary: Set Default Guide Pricing
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTourSchema'
 *     responses:
 *       201:
 *         description: Set Default Guide Pricing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tour'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/tour/guide-pricing/default",
  validate(defaultGuidePricingSchema),
  setDefaultGuidePricing
);

/**
 * @swagger
 * /api/admin/tours:
 *   post:
 *     summary: Create a new tour
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTourSchema'
 *     responses:
 *       201:
 *         description: Tour created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tour'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post("/tour", validate(createTourSchema), createTour);

/**
 * @swagger
 * /api/admin/tour/{tourId}:
 *   post:
 *     summary: Add Tour Images
 *     tags: [Tour-images]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tour Images added successfully
 *       401:
 *         description: Invalid input
 *       404:
 *         description: Unauthorized
 */
router.post(
  "/tour/:tourId",
  cloudinaryUploadFromParams("tour", "tourId").array("imageUrl", 10),
  addTourImages
);

/**
 * @swagger
 * /api/admin/tour/{tourId}/images:
 *   patch:
 *     summary: remove Tour Images
 *     tags: [Tour-images]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tour Images removed successfully
 *       401:
 *         description: Invalid input
 *       404:
 *         description: Unauthorized
 */

router.patch("/tour/:tourId/images", removeTourImages);

/**
 * @swagger
 * /api/admin/tour/{tourId}:
 *   patch:
 *     summary: update  tour
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTourSchema'
 *     responses:
 *       201:
 *         description: Tour updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tour'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.patch("/tour/:tourId", validate(updateTourSchema), updateTour);

/**
 * @swagger
 * /api/admin/tour/{tourId}/guide-pricing:
 *   delete:
 *     summary: delete Tour Guide Pricing
 *     tags: [Tour Guide Pricing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tour Guide Pricing deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tour Guide Pricing not found
 */
router.delete("/tour/:tourId/guide-pricing", deleteTourGuidePricing);
router.delete("/tour/:tourId", deleteTour);

// Itinerary API
router.post("/itinerary", validate(createItinerarySchema), createItinerary);
router.patch(
  "/itinerary/:itineraryId",
  validate(updateItinerarySchema),
  updateItinerary
);
/**
 * @swagger
 * /api/admin/itinerary/{itineraryId}:
 *   delete:
 *     summary: delete Itinerary
 *     tags: [Itinerary]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Itinerary deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Itinerary not found
 */
router.delete("/itinerary/:itineraryId", deleteItinerary);

/**
 * @swagger
 * /api/admin/itinerary/{itineraryId}/add-activities:
 *   patch:
 *     summary: add Activity
 *     tags: [Itinerary-Activity]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Itinerary-Activity Added successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Itinerary-Activity not found
 */
router.patch("/itinerary/:itineraryId/add-activities", addActivity);
/**
 * @swagger
 * /api/admin/itinerary/{itineraryId}/remove-activities:
 *   delete:
 *     summary: remove Activity
 *     tags: [Itinerary-Activity]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Itinerary-Activity removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Itinerary-Activity not found
 */
router.delete("/itinerary/:itineraryId/remove-activities", removeActivity);

// Tour Schedule API
router.post(
  "/tour-schedule",
  validate(createTourScheduleSchema),
  createTourSchedule
);
router.patch(
  "/tour-schedule/:tourScheduleId",
  validate(updateTourScheduleSchema),
  updateTourSchedule
);

/**
 * @swagger
 * /api/admin/tour-schedule/{tourScheduleId}:
 *   delete:
 *     summary: delete TourSchedule
 *     tags: [TourSchedule]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: TourSchedule delete successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: TourSchedule not found
 */
router.delete("/tour-schedule/:tourScheduleId", deleteTourSchedule);

export default router;
