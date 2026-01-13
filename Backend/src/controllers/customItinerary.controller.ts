import { Request, Response, NextFunction } from "express";
import {
  admincustomItineraryquerySchema,
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

// Update custom Itinerary
const updateMyCustomItinerary = async (
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
    const validatedData = updateCustomItinerarySchema.parse(req.body);

    const itinerary = await prisma.customItinerary.findFirst({
      where: {
        id: itineraryId,
        userId,
      },
    });

    if (!itinerary) {
      return next({
        status: 404,
        success: false,
        message: "Itinerary not found",
      });
    }

    const updatedItinerary = await prisma.customItinerary.update({
      where: { id: itineraryId },
      data: {
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
        events: {
          orderBy: [{ day: "asc" }, { order: "asc" }],
        },
      },
    });

    return next({
      status: 200,
      success: true,
      data: updatedItinerary,
    });
  } catch (error: any) {
    console.error("Error updating itinerary:", error);
    return next({
      status: 400,
      success: false,
      message: error.message || "Failed to update itinerary",
    });
  }
};

// Delete custom Itinerary
const deleteMyCustomItinerary = async (
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
    });

    if (!itinerary) {
      return next({
        status: 404,
        success: false,
        message: "Itinerary not found",
      });
    }

    await prisma.customItinerary.delete({
      where: { id: itineraryId },
    });

    return next({
      status: 200,
      success: true,
      message: "Itinerary deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting itinerary:", error);
    return next({
      status: 500,
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all custom Itinerary - Admin
const getAllCustomItinerariesAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 10,
      destinationId,
      userId,
    } = admincustomItineraryquerySchema.parse(req.query);

    const skip = (page - 1) * limit;

    const where: any = {};
    if (destinationId) where.destinationId = destinationId;
    if (userId) where.userId = userId;

    const [itineraries, total] = await Promise.all([
      prisma.customItinerary.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
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
    console.error("Admin get all custom itineraries error:", error);
    return next({
      status: 500,
      success: false,
      message: "Internal server error",
    });
  }
};

// Get custom itinerary by id
const getCustomItineraryByIdAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itineraryId } = customItineraryParamsSchema.parse(req.params);

    const itinerary = await prisma.customItinerary.findUnique({
      where: { id: itineraryId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
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
    console.error("Admin get custom itinerary by id error:", error);
    return next({
      status: 500,
      success: false,
      message: "Internal server error",
    });
  }
};

export {
  createCustomItinerary,
  getMyCustomItineraries,
  getMyCustomItineraryById,
  updateMyCustomItinerary,
  deleteMyCustomItinerary,
  getAllCustomItinerariesAdmin,
  getCustomItineraryByIdAdmin,
};
