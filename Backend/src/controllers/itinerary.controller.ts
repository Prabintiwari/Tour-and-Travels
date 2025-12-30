import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { createItinerarySchema } from "../utils/zod";
import { ActivityType } from "../types/activity.types";

// CREATE ITINERARY

const createItinerary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createItinerarySchema.parse(req.body);

    // Verify tour exists
    const tour = await prisma.tour.findUnique({
      where: { id: validatedData.tourId },
    });

    if (!tour) {
      next({ status: 404, success: false, message: "Tour not found" });
      return;
    }

    // Check if day already exists for this tour
    const existingItinerary = await prisma.itinerary.findUnique({
      where: {
        tourId_day: {
          tourId: validatedData.tourId,
          day: validatedData.day,
        },
      },
    });

    if (existingItinerary) {
      next({
        status: 400,
        success: false,
        message: `Itinerary for day ${validatedData.day} already exists for this tour`,
      });
      return;
    }

    // Verify day doesn't exceed tour duration
    if (validatedData.day > tour.numberOfDays) {
      res.status(400).json({
        success: false,
        message: `Day ${validatedData.day} exceeds tour duration of ${tour.numberOfDays} days`,
      });
      return;
    }

    const itinerary = await prisma.itinerary.create({
      data: {
        tourId: validatedData.tourId,
        day: validatedData.day,
        title: validatedData.title,
        description: validatedData.description,
        activities: (validatedData.activities as ActivityType[]) || [],
        accommodationType: validatedData.accommodationType,
        mealInclusions: validatedData.mealInclusions,
        
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



export { createItinerary };
