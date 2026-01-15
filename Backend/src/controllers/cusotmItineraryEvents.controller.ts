import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import {
  adminCustomItineraryEventQuerySchema,
  createCustomItineraryEventSchema,
  customItineraryEventParamsSchema,
  customItineraryEventQuerySchema,
  customItineraryEventWithItineraryParamsSchema,
  updateCustomItineraryEventSchema,
} from "../schema/customItineraryEvent.schema";
import { AuthRequest } from "../middleware/auth";
import { customItineraryParamsSchema } from "../schema/customItinerary.schema";
import { ZodError } from "zod";

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
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
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

    const { itineraryId, eventId } =
      customItineraryEventWithItineraryParamsSchema.parse(req.params);

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
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    console.error("Error updating custom itinerary event:", error);

    return next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Get Custom Itinerary Events by Itinerary Id
const getMyCustomItineraryEventsByItineraryId = async (
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

    const { type, page, limit } = customItineraryEventQuerySchema.parse(
      req.query
    );
    const { itineraryId } = customItineraryParamsSchema.parse(req.params);

    const skip = (page - 1) * limit;

    const where: any = {
      itineraryId,
      itinerary: {
        userId: userId,
      },
    };

    if (type) {
      where.type = type;
    }

    const [events, total] = await Promise.all([
      prisma.customItineraryEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { itineraryId: "asc" },
          { day: "asc" },
          { order: "asc" },
          { createdAt: "asc" },
        ],
        include: {
          itinerary: {
            select: {
              id: true,
              title: true,
              destination: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      prisma.customItineraryEvent.count({ where }),
    ]);

    return next({
      status: 200,
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    console.error("Error fetching user itinerary events:", error);
    return next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Get Custom Itinerary Events by Id
const getMyCustomItineraryEventsById = async (
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

    const { eventId } = customItineraryEventParamsSchema.parse(req.params);
    const where: any = {
      id: eventId,
      itinerary: {
        userId: userId,
      },
    };

    const event = await prisma.customItineraryEvent.findMany({
      where,
      include: {
        itinerary: {
          select: {
            id: true,
            title: true,
            destination: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!event) {
      return next({
        status: 404,
        success: false,
        message: "Events not found!",
      });
    }

    return next({
      status: 200,
      success: true,
      data: {
        event,
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    console.error("Error fetching user itinerary events:", error);
    return next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Get my all Custom Itinerary Events
const getMyAllCustomItineraryEvents = async (
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

    const { type, page, limit } = customItineraryEventQuerySchema.parse(
      req.query
    );

    const skip = (page - 1) * limit;

    const where: any = {
      itinerary: {
        userId: userId,
      },
    };

    if (type) {
      where.type = type;
    }

    const [events, total] = await Promise.all([
      prisma.customItineraryEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ day: "asc" }, { order: "asc" }, { createdAt: "asc" }],
        include: {
          itinerary: {
            select: {
              id: true,
              title: true,
              destination: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      prisma.customItineraryEvent.count({ where }),
    ]);

    return next({
      status: 200,
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    console.error("Error fetching user itinerary events:", error);
    return next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Get Custom Itinerary Events by Id -(Admin)
const getCustomItineraryEventsByIdAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventId } = customItineraryEventParamsSchema.parse(req.params);

    const event = await prisma.customItineraryEvent.findUnique({
      where: { id: eventId },
      include: {
        itinerary: {
          select: {
            id: true,
            title: true,
            destination: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
    if (!event) {
      return next({
        status: 404,
        success: false,
        message: "Events not found!",
      });
    }

    return next({
      status: 200,
      success: true,
      data: {
        event,
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    console.error("Error fetching user itinerary events:", error);
    return next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Get Custom Itinerary Events by Itinerary Id - (Admin)
const getCustomItineraryEventsByItineraryIdAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      type,
      page = 1,
      limit = 10,
    } = customItineraryEventQuerySchema.parse(req.query);

    const { itineraryId } = customItineraryParamsSchema.parse(req.params);

    const skip = (page - 1) * limit;

    const where: any = { itineraryId };
    if (type) where.type = type;

    const [events, total] = await Promise.all([
      prisma.customItineraryEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ day: "asc" }, { order: "asc" }, { createdAt: "asc" }],
        include: {
          itinerary: {
            select: {
              id: true,
              title: true,
              user: {
                select: { id: true, fullName: true, email: true },
              },
              destination: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      prisma.customItineraryEvent.count({ where }),
    ]);

    return next({
      status: 200,
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    console.error("Admin get itinerary events error:", error);
    return next({
      status: 500,
      success: false,
      message: "Internal server error",
    });
  }
};

const getAllCustomItineraryEventsAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      type,
      itineraryId,
      userId,
      page = 1,
      limit = 20,
    } = adminCustomItineraryEventQuerySchema.parse(req.query);

    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (itineraryId) where.itineraryId = itineraryId;
    if (userId) where.itinerary = { userId };

    const [events, total] = await Promise.all([
      prisma.customItineraryEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { itineraryId: "asc" },
          { day: "asc" },
          { order: "asc" },
          { createdAt: "asc" },
        ],
        include: {
          itinerary: {
            select: {
              id: true,
              title: true,
              user: { select: { id: true, fullName: true, email: true } },
              destination: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.customItineraryEvent.count({ where }),
    ]);

    return next({
      status: 200,
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    console.error("Admin get all custom itinerary events error:", error);
    return next({
      status: 500,
      success: false,
      message: "Internal server error",
    });
  }
};

export {
  createCustomItineraryEvent,
  updateCustomItineraryEvent,
  getMyCustomItineraryEventsByItineraryId,
  getMyCustomItineraryEventsById,
  getMyAllCustomItineraryEvents,
  getCustomItineraryEventsByIdAdmin,
  getCustomItineraryEventsByItineraryIdAdmin,
  getAllCustomItineraryEventsAdmin,
};
