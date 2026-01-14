import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { createCustomItineraryEventSchema } from "../schema/customItineraryEvent.schema";
import { AuthRequest } from "../middleware/auth";
import { customItineraryParamsSchema } from "../schema/customItinerary.schema";

const createCustomItineraryEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.id;

    if (!userId) {
      return next({
        status: 401,
        success: false,
        message: "Unauthorized",
      });
    }

    const { itineraryId } = customItineraryParamsSchema.parse(req.params);

    const validatedData = createCustomItineraryEventSchema.parse(req.body);

    // check itinerary ownership
    const itinerary = await prisma.customItinerary.findUnique({
      where: { id: itineraryId },
      select: { id: true, userId: true },
    });

    if (!itinerary) {
      return next({
        status: 404,
        success: false,
        message: "Itinerary not found",
      });
    }

    if (itinerary.userId !== userId) {
      return next({
        status: 403,
        success: false,
        message: "Forbidden - not the owner",
      });
    }

    const event = await prisma.customItineraryEvent.create({
      data: {
        itineraryId,
        title: validatedData.title,
        description: validatedData.description,
        location: validatedData.location,
        type: validatedData.type,
        notes: validatedData.notes,
        day: validatedData.day,
        order: validatedData.order,
        startTime: validatedData.startTime
          ? new Date(validatedData.startTime)
          : null,
        endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
      },
    });

    return next({
      status: 201,
      success: true,
      data: event,
    });
  } catch (error: any) {
    console.error("Error creating custom itinerary event:", error);

    return next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export default createCustomItineraryEvent;
