import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import {
  createCustomItineraryEventSchema,
  customItineraryEventQuerySchema,
  updateCustomItineraryEventSchema,
} from "../schema/customItineraryEvent.schema";
import { AuthRequest } from "../middleware/auth";
import { customItineraryParamsSchema } from "../schema/customItinerary.schema";

// Create Custom Itinerary Events
const createCustomItineraryEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
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

// Update Custom Itinerary Events
const updateCustomItineraryEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.id;
    if (!userId) {
      return next({
        status: 401,
        success: false,
        message: "Unauthorized",
      });
    }

    const { itineraryId, eventId } = req.params;

    const validatedData = updateCustomItineraryEventSchema.parse(req.body);

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

    const event = await prisma.customItineraryEvent.findFirst({
      where: {
        id: eventId,
        itineraryId,
      },
    });

    if (!event) {
      return next({
        status: 404,
        success: false,
        message: "Event not found",
      });
    }

    const updateData: any = {
      ...validatedData,
    };

    if (validatedData.startTime !== undefined) {
      updateData.startTime = validatedData.startTime
        ? new Date(validatedData.startTime)
        : null;
    }

    if (validatedData.endTime !== undefined) {
      updateData.endTime = validatedData.endTime
        ? new Date(validatedData.endTime)
        : null;
    }

    const updatedEvent = await prisma.customItineraryEvent.update({
      where: { id: eventId },
      data: updateData,
    });

    return next({
      status: 200,
      success: true,
      data: updatedEvent,
    });
  } catch (error: any) {
    console.error("Error updating custom itinerary event:", error);

    return next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Get Custom Itinerary Events
const getCustomItineraryEvents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.id;
  if (!userId) {
    return next({
      status: 401,
      success: false,
      message: "Unauthorized",
    });
  }

  const { itineraryId, type, page, limit } =
    customItineraryEventQuerySchema.parse(req.query);

  const skip = (page - 1) * limit;

  const filters: any = {};
  if (itineraryId) filters.itineraryId = itineraryId;
  if (type) filters.type = type;

  const [events, total] = await Promise.all([
    prisma.customItineraryEvent.findMany({
      where: filters,
      skip,
      take: limit,
      orderBy: { ["createdAt"]: "asc" },
      include: {
        itinerary: {
          select: {
            id: true,
            title: true,
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    }),
    prisma.customItineraryEvent.count({ where: filters }),
  ]);

  return next({
    status: 200,
    success: true,
    data: {
      events,
      pagination: { total, page, limit, totalPage: Math.ceil(total / limit) },
    },
  });
};

export {
  createCustomItineraryEvent,
  updateCustomItineraryEvent,
   getCustomItineraryEvents 
,
};
