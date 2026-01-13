import { Request, Response, NextFunction } from "express";
import {
  createCustomItinerarySchema,
  customItineraryParamsSchema,
  customItineraryquerySchema,
  updateCustomItinerarySchema,
} from "../schema/customItinerary.schema";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/auth";

// Create custom Itinerary
const createCustomItinerary = async (
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

    const validatedData = createCustomItinerarySchema.parse(req.body);

    const destination = await prisma.destination.findUnique({
      where: { id: validatedData.destinationId },
      select: { id: true },
    });

    if (!destination) {
      return next({
        status: 404,
        success: false,
        message: "Destination not found",
      });
    }

    // Create itinerary
    const itinerary = await prisma.customItinerary.create({
      data: {
        userId,
        destinationId: validatedData.destinationId,
        title: validatedData.title,
        description: validatedData.description,
        numberOfDays: validatedData.numberOfDays,
      },
      include: {
        destination: {
          select: {
            id: true,
            name: true,
            location: true,
            imageUrl: true,
          },
        },
        events: true,
      },
    });

    return next({
      status: 201,
      success: true,
      data: itinerary,
    });
  } catch (error: any) {
    console.error("Error creating custom itinerary:", error);

    return next({
      status: 400,
      success: false,
      message: error?.message || "Failed to create itinerary",
    });
  }
};

// Get custom Itineraries
const getMyCustomItineraries = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.id;
    if (!userId) {
      return next({ status: 401, success: false, message: "Unauthorized" });
    }

    const {
      page = 1,
      limit = 10,
      destinationId,
    } = customItineraryquerySchema.parse(req.query);

    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (destinationId) {
      where.destinationId = destinationId;
    }

    const [itineraries, total] = await Promise.all([
      prisma.customItinerary.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          destination: {
            select: {
              id: true,
              name: true,
              location: true,
              imageUrl: true,
            },
          },
          events: {
            orderBy: [{ day: "asc" }, { order: "asc" }],
          },
        },
      }),
      prisma.customItinerary.count({ where }),
    ]);

    return next({
      status: 200,
      success: true,
      data: {
        itineraries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching itineraries:", error);
    return next({
      status: 500,
      success: false,
      message: "Internal server error",
    });
  }
};

// Get custom Itinerary by Id
const getMyCustomItineraryById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.id;
    if (!userId) {
      return next({ status: 401, success: false, message: "Unauthorized" });
    }

    const { itineraryId } = customItineraryParamsSchema.parse(req.params);

    const itinerary = await prisma.customItinerary.findFirst({
      where: {
        id: itineraryId,
        userId,
      },
      include: {
        destination: {
          select: {
            id: true,
            name: true,
            location: true,
            imageUrl: true,
            description: true,
          },
        },
        events: {
          orderBy: [{ day: "asc" }, { order: "asc" }],
        },
      },
    });

    if (!itinerary) {
      return next({
        status: 404,
        success: false,
        message: "Itinerary not found",
      });
    }

    return next({
      status: 200,
      success: true,
      data: itinerary,
    });
  } catch (error: any) {
    console.error("Error fetching itinerary:", error);
    return next({
      status: 500,
      success: false,
      message: "Internal server error",
    });
  }
};


const updateCustomItinerary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.id;
    if (!userId) {
      next({ status: 401, success: false, message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const validatedData = updateCustomItinerarySchema.parse(req.body);

    const existingItinerary = await prisma.customItinerary.findUnique({
      where: { id },
    });

    if (!existingItinerary) {
      next({ status: 404, success: false, error: "Itinerary not found" });
      return;
    }

    if (existingItinerary.userId !== userId) {
      next({
        status: 403,
        success: false,
        message: "Forbidden - not the owner",
      });
      return;
    }

    const updatedItinerary = await prisma.customItinerary.update({
      where: { id },
      data: validatedData,
      include: {
        destination: {
          select: {
            id: true,
            name: true,
            location: true,
            imageUrl: true,
          },
        },
        events: {
          orderBy: { startTime: "asc" },
        },
      },
    });

    next({ status: 200, success: true, updatedItinerary });
  } catch (error: any) {
    console.error("Error updating itinerary:", error);
    next({
      status: 500,
      success: false,
      message: error.message || "Interna; server error",
      error: "Internal server error",
    });
  }
};

const deleteCustomItinerary = async (
  req: Request,

  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      next({ status: 401, success: false, message: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    const existingItinerary = await prisma.customItinerary.findUnique({
      where: { id },
    });

    if (!existingItinerary) {
      next({ status: 404, success: false, error: "Itinerary not found" });
      return;
    }

    if (existingItinerary.userId !== userId) {
      next({
        status: 403,
        success: false,
        message: "Forbidden - not the owner",
      });
      return;
    }

    await prisma.customItinerary.delete({
      where: { id },
    });

    next({
      status: 200,
      success: true,
      message: "Itinerary deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting itinerary:", error);
    next({
      status: 500,
      success: false,
      message: error.message || "Interna; server error",
      error: "Internal server error",
    });
  }
};

export {
  createCustomItinerary,
  getMyCustomItineraries,
  getMyCustomItineraryById,
  updateCustomItinerary,
  deleteCustomItinerary,
};
