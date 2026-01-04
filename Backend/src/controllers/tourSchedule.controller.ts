import { Request, Response, NextFunction } from "express";
import {
  createTourScheduleSchema,
  updateTourScheduleSchema,
} from "../schema";
import prisma from "../config/prisma";
import { getTourSchedulesQuerySchema } from "../types/tourSchedules.types";

//Create a new tour schedule
const createTourSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createTourScheduleSchema.parse(req.body);

    // Check if tour exists
    const tour = await prisma.tour.findUnique({
      where: { id: validatedData.tourId },
    });

    if (!tour) {
      next({ status: 404, success: false, message: "Tour not found" });
      return;
    }

    // Check for overlapping schedules
    const overlappingSchedule = await prisma.tourSchedule.findFirst({
      where: {
        tourId: validatedData.tourId,
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(validatedData.startDate) } },
              { endDate: { gte: new Date(validatedData.startDate) } },
            ],
          },
          {
            AND: [
              { startDate: { lte: new Date(validatedData.endDate) } },
              { endDate: { gte: new Date(validatedData.endDate) } },
            ],
          },
          {
            AND: [
              { startDate: { gte: new Date(validatedData.startDate) } },
              { endDate: { lte: new Date(validatedData.endDate) } },
            ],
          },
        ],
      },
    });

    if (overlappingSchedule) {
      next({
        status: 400,
        success: false,
        message:
          "Schedule overlaps with an existing schedule for this tour. Please check available schedules.",
      });
      return;
    }

    const schedule = await prisma.tourSchedule.create({
      data: {
        tourId: validatedData.tourId,
        title: validatedData.title,
        description: validatedData.description,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        availableSeats: validatedData.availableSeats,
        price: validatedData.price,
        isActive: validatedData.isActive,
      },
      include: {
        tour: {
          select: {
            id: true,
            title: true,
            destinationId: true,
          },
        },
      },
    });

    next({
      status: 200,
      success: true,
      message: "Tour schedule created successfully",
      data: schedule,
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//Get all tour schedules with filters
const getTourSchedules = async (
  req: Request<{}, {}, {}, getTourSchedulesQuerySchema>,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      tourId,
      startDate,
      endDate,
      isActive,
      page = "1",
      limit = "10",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filters: any = {};

    if (tourId) {
      filters.tourId = tourId;
    }

    if (isActive) {
      filters.isActive = isActive === "true";
    }

    if (startDate) {
      filters.startDate = { gte: new Date(startDate) };
    }

    if (endDate) {
      filters.endDate = { lte: new Date(endDate) };
    }

    const [schedules, total] = await Promise.all([
      prisma.tourSchedule.findMany({
        where: filters,
        skip,
        take: parseInt(limit),
        orderBy: { startDate: "asc" },
        include: {
          tour: {
            select: {
              id: true,
              title: true,
              destinationId: true,
              destination: {
                select: {
                  id: true,
                  name: true,
                  location: true,
                },
              },
            },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
      }),
      prisma.tourSchedule.count({ where: filters }),
    ]);

    next({
      status: 200,
      success: true,
      data: {
        schedules,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get tour schedule by id
const getTourScheduleById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tourScheduleId } = req.params;

    const schedule = await prisma.tourSchedule.findUnique({
      where: { id: tourScheduleId },
      include: {
        tour: {
          include: {
            destination: true,
            itineraries: {
              orderBy: { day: "asc" },
            },
          },
        },
        bookings: {
          select: {
            id: true,
            bookingCode: true,
            numberOfParticipants: true,
            status: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      next({ status: 404, success: false, message: "Tour schedule not found" });
      return;
    }

    next({ status: 200, success: true, data: schedule });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update a tour schedule
const updateTourSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tourScheduleId } = req.params;
    const validatedData = updateTourScheduleSchema.parse(req.body);

    // Check if schedule exists
    const existingSchedule = await prisma.tourSchedule.findUnique({
      where: { id: tourScheduleId },
    });

    if (!existingSchedule) {
      next({ status: 404, success: false, message: "Tour schedule not found" });
      return;
    }

    // Check if there are any bookings before allowing certain updates
    if (validatedData.availableSeats !== undefined) {
      if (validatedData.availableSeats < existingSchedule.currentBookings) {
        res.status(400).json({
          success: false,
          message: "Cannot reduce available seats below current bookings",
        });
        return;
      }
    }

    const startDate = validatedData.startDate
      ? new Date(validatedData.startDate)
      : existingSchedule.startDate;
    const endDate = validatedData.endDate
      ? new Date(validatedData.endDate)
      : existingSchedule.endDate;

    // Check for overlapping schedules if dates are being updated
    if (validatedData.startDate || validatedData.endDate) {
      const overlappingSchedule = await prisma.tourSchedule.findFirst({
        where: {
          tourId: existingSchedule.tourId,
          id: { not: tourScheduleId },
          OR: [
            {
              AND: [
                { startDate: { lte: startDate } },
                { endDate: { gte: startDate } },
              ],
            },
            {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: endDate } },
              ],
            },
            {
              AND: [
                { startDate: { gte: startDate } },
                { endDate: { lte: endDate } },
              ],
            },
          ],
        },
      });

      if (overlappingSchedule) {
        next({
          status: 400,
          success: false,
          message: "Updated schedule overlaps with an existing schedule",
        });
        return;
      }
    }

    const schedule = await prisma.tourSchedule.update({
      where: { id: tourScheduleId },
      data: {
        ...validatedData,
        startDate,
        endDate,
      },
      include: {
        tour: {
          select: {
            id: true,
            title: true,
            destinationId: true,
          },
        },
      },
    });

    next({
      status: 200,
      success: true,
      message: "Tour schedule updated successfully",
      data: schedule,
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete a tour schedule
const deleteTourSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tourScheduleId } = req.params;

    const schedule = await prisma.tourSchedule.findUnique({
      where: { id: tourScheduleId },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!schedule) {
      next({ status: 404, success: false, message: "Tour schedule not found" });
      return;
    }

    if (schedule._count.bookings > 0) {
      next({
        status: 400,
        success: false,
        message: "Cannot delete schedule with existing bookings",
      });
      return;
    }

    await prisma.tourSchedule.delete({
      where: { id: tourScheduleId },
    });

    next({
      status: 200,
      success: true,
      message: "Tour schedule deleted successfully",
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//Get available schedules for  specific tour
const getAvailableSchedules = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tourId } = req.params;

    const schedules = await prisma.tourSchedule.findMany({
      where: {
        tourId,
        isActive: true,
        startDate: { gte: new Date() },
        availableSeats: { gt: 0 },
      },
      orderBy: { startDate: "asc" },
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
      status: 300,
      success: true,
      data: schedules,
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
  createTourSchedule,
  getTourSchedules,
  getTourScheduleById,
  updateTourSchedule,
  deleteTourSchedule,
  getAvailableSchedules,
};
