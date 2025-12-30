import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { createItinerarySchema, updateItinerarySchema } from "../utils/zod";
import { ActivityType } from "../types/activity.types";

// CREATE ITINERARY
const createItinerary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validateData = createItinerarySchema.parse(req.body);

    // Verify tour exists
    const tour = await prisma.tour.findUnique({
      where: { id: validateData.tourId },
    });

    if (!tour) {
      next({ status: 404, success: false, message: "Tour not found" });
      return;
    }

    // Check if day already exists for this tour
    const existingItinerary = await prisma.itinerary.findUnique({
      where: {
        tourId_day: {
          tourId: validateData.tourId,
          day: validateData.day,
        },
      },
    });

    if (existingItinerary) {
      next({
        status: 400,
        success: false,
        message: `Itinerary for day ${validateData.day} already exists for this tour`,
      });
      return;
    }

    // Verify day doesn't exceed tour duration
    if (validateData.day > tour.numberOfDays) {
      res.status(400).json({
        success: false,
        message: `Day ${validateData.day} exceeds tour duration of ${tour.numberOfDays} days`,
      });
      return;
    }

    const itinerary = await prisma.itinerary.create({
      data: {
        tourId: validateData.tourId,
        day: validateData.day,
        title: validateData.title,
        description: validateData.description,
        activities: (validateData.activities as ActivityType[]) || [],
        accommodationType: validateData.accommodationType,
        mealInclusions: validateData.mealInclusions,
      },
    });

    next({
      status: 200,
      success: true,
      message: "Itinerary created successfully",
      data: itinerary,
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// GET ALL ITINERARIES BY TOUR
const getItinerariesByTour = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tourId } = req.params;

    if (!tourId) {
      next({ status: 400, success: false, message: "Tour ID is required" });
      return;
    }

    // Verify tour exists
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      next({
        status: 404,
        success: false,
        message: "Tour not found",
      });
      return;
    }

    const itineraries = await prisma.itinerary.findMany({
      where: { tourId },
      orderBy: { day: "asc" },
    });

    next({
      status: 200,
      success: true,
      message: "Itineraries retrieved successfully",
      data: { itineraries, total: itineraries.length },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// GET SINGLE ITINERARY
const getItineraryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itineraryId } = req.params;

    const itinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId },
      include: {
        tour: {
          include: {
            destination: true,
            reviews: {
              select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!itinerary) {
      next({ status: 404, success: false, message: "Itinerary not found" });
      return;
    }

    next({
      status: 200,
      success: true,
      message: "Itinerary retrieved successfully",
      data: itinerary,
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//  UPDATE ITINERARY
const updateItinerary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itineraryId } = req.params;
    const validateData = updateItinerarySchema.parse(req.body);

    // Verify itinerary exists
    const existingItinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId },
    });

    if (!existingItinerary) {
      next({ status: 404, success: false, message: "Itinerary not found" });
      return;
    }

    // const { day, ...updateData } = validateData;

    // If updating day, check for conflicts
    if (
      validateData.day !== undefined &&
      validateData.day !== existingItinerary.day
    ) {
      const conflictingItinerary = await prisma.itinerary.findUnique({
        where: {
          tourId_day: {
            tourId: existingItinerary.tourId,
            day: validateData.day,
          },
        },
      });

      if (conflictingItinerary) {
        next({
          status: 400,
          success: false,
          message: `Itinerary for day ${validateData.day} already exists`,
        });
        return;
      }

      // Verify day doesn't exceed tour duration
      const tour = await prisma.tour.findUnique({
        where: { id: existingItinerary.tourId },
      });

      if (tour && validateData.day > tour.numberOfDays) {
        next({
          status: 400,
          success: false,
          message: `Day ${validateData.day} exceeds tour duration of ${tour.numberOfDays} days`,
        });
        return;
      }
    }

    const updatedItinerary = await prisma.itinerary.update({
      where: { id: itineraryId },
      data: {
        ...validateData
      },
      include: {
        tour: {
          select: {
            id: true,
            title: true,
            numberOfDays: true,
          },
        },
      },
    });

    next({
      status: 200,
      success: true,
      message: "Itinerary updated successfully",
      data: updatedItinerary,
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// DELETE ITINERARY
const deleteItinerary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itineraryId } = req.params;

    const itinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId },
    });

    if (!itinerary) {
      next({ status: 404, success: false, message: "Itinerary not found" });
      return;
    }

    await prisma.itinerary.delete({
      where: { id: itineraryId },
    });

    next({
      status: 200,
      success: true,
      message: "Itinerary deleted successfully",
      data: { id: itineraryId },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//  ADD ACTIVITY
const addActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itineraryId } = req.params;
    const { time, activity, location } = req.body;

    if (!time || !activity || !location) {
      next({
        status: 400,
        success: false,
        message: "time, activity, and location are required",
      });
      return;
    }

    const itinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId },
    });

    if (!itinerary) {
      next({ status: 404, success: false, message: "Itinerary not found" });
      return;
    }

    const newActivity: ActivityType = { time, activity, location };

    const updatedItinerary = await prisma.itinerary.update({
      where: { id: itineraryId },
      data: {
        activities: {
          push: newActivity,
        },
      },
    });
    next({
      status: 200,
      success: true,
      message: "Activity added successfully",
      data: updatedItinerary,
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//  REMOVE ACTIVITY
const removeActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itineraryId } = req.params;
    const { activityIndex } = req.body;

    if (typeof activityIndex !== "number" || activityIndex < 0) {
      next({
        status: 400,
        success: false,
        message: "Valid activityIndex is required",
      });
      return;
    }

    const itinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId },
    });

    if (!itinerary) {
      next({ status: 404, success: false, message: "Itinerary not found" });
      return;
    }

    if (activityIndex >= itinerary.activities.length) {
      next({
        status: 400,
        success: false,
        message: "Activity index out of bounds",
      });
      return;
    }

    const updatedActivities = itinerary.activities.filter(
      (_, i) => i !== activityIndex
    );

    const updatedItinerary = await prisma.itinerary.update({
      where: { id: itineraryId },
      data: {
        activities: updatedActivities as ActivityType[],
      },
    });

    next({
      status: 200,
      success: true,
      message: "Activity removed successfully",
      data: updatedItinerary,
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//  GET ITINERARY COMPLETE DETAILS
const getCompleteItinerary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const itinerary = await prisma.itinerary.findMany({
      include: {
        tour: {
          select: {
            id: true,
            title: true,
            numberOfDays: true,
            destination: true,
          },
        },
      },
    });

    if (!itinerary) {
      next({ status: 404, success: false, message: "Itinerary not found" });
      return;
    }

    next({
      status: 200,
      success: true,
      message: "Complete itinerary retrieved successfully",
      data: { itinerary, total: itinerary.length },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export {
  createItinerary,
  getItinerariesByTour,
  getItineraryById,
  updateItinerary,
  deleteItinerary,
  addActivity,
  removeActivity,
  getCompleteItinerary,
};
