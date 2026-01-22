import { Request, Response, NextFunction } from "express";
import { BookingStatus, GuidePricingType } from "@prisma/client";
import { generateBookingCode } from "../utils/generateBookingCode";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/auth";
import {
  bookingParamsSchema,
  bookingQuerySchema,
  createBookingSchema,
  getBookingQuerySchema,
  rescheduleBookingSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
} from "../schema";
import { ZodError } from "zod";

// Create a new tour booking
const createTourBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.id;
    if (!userId) {
      return next({
        status: 400,
        success: false,
        message: "Authentication required",
      });
    }

    const validateData = createBookingSchema.parse(req.body);

    /* Verify tour */
    const tour = await prisma.tour.findUnique({
      where: { id: validateData.tourId },
    });

    if (!tour || !tour.isActive) {
      return next({
        status: 404,
        success: false,
        message: "Tour not found or inactive",
      });
    }

    /* Verify schedule */
    const schedule = await prisma.tourSchedule.findUnique({
      where: { id: validateData.scheduleId },
    });

    if (!schedule || !schedule.isActive) {
      return next({
        status: 404,
        success: false,
        message: "Schedule not found or inactive",
      });
    }

    /* Seat validation */
    const availableSeats = schedule.availableSeats - schedule.currentBookings;
    if (availableSeats < validateData.numberOfParticipants) {
      return next({
        status: 400,
        success: false,
        message: `Only ${availableSeats} seats available`,
      });
    }

    /* Min / Max participants */
    if (
      tour.minParticipants &&
      validateData.numberOfParticipants < tour.minParticipants
    ) {
      return next({
        status: 400,
        success: false,
        message: `Minimum ${tour.minParticipants} participants required`,
      });
    }

    if (
      tour.maxParticipants &&
      validateData.numberOfParticipants > tour.maxParticipants
    ) {
      return next({
        status: 400,
        success: false,
        message: `Maximum ${tour.maxParticipants} participants allowed`,
      });
    }

    /* GUIDE PRICING LOGIC */
    let guideSnapshot = {
      guidePricingType: undefined as GuidePricingType | undefined,
      guidePriceAtBooking: 0,
      guideMinimumCharge: null as number | null,
      guideTotalPrice: 0,
    };

    if (validateData.needsGuide) {
      let tourGuidePricing = await prisma.tourGuidePricing.findFirst({
        where: { tourId: tour.id, isActive: true },
      });

      if (!tourGuidePricing) {
        tourGuidePricing = await prisma.tourGuidePricing.findFirst({
          where: { isDefault: true, isActive: true },
        });
      }

      if (!tourGuidePricing) {
        return next({
          status: 404,
          success: false,
          message: "Active tour guide pricing not found",
        });
      }

      let guideTotalPrice = 0;
      let guidePriceAtBooking = 0;

      switch (validateData.guidePricingType) {
        case GuidePricingType.PER_DAY:
          guideTotalPrice =
            (tourGuidePricing.pricePerDay ?? 0) *
            (validateData.numberOfGuideNeeds ?? 1) *
            (tour.numberOfDays ?? 1);
          guidePriceAtBooking = tourGuidePricing.pricePerDay ?? 0;
          break;

        case GuidePricingType.PER_PERSON:
          guideTotalPrice =
            (tourGuidePricing.pricePerPerson ?? 0) *
            validateData.numberOfParticipants;
          guidePriceAtBooking = tourGuidePricing.pricePerPerson ?? 0;
          break;

        case GuidePricingType.PER_GROUP:
          guideTotalPrice = tourGuidePricing.pricePerGroup ?? 0;
          guidePriceAtBooking = tourGuidePricing.pricePerGroup ?? 0;
          break;

        default:
          return next({
            status: 400,
            success: false,
            message: "Invalid guide pricing type selected",
          });
      }

      // Minimum charge protection
      if (
        tourGuidePricing.minimumCharge &&
        guideTotalPrice < tourGuidePricing.minimumCharge
      ) {
        guideTotalPrice = tourGuidePricing.minimumCharge;
      }

      guideSnapshot = {
        guidePricingType: validateData.guidePricingType,
        guidePriceAtBooking: guidePriceAtBooking,
        guideMinimumCharge: tourGuidePricing.minimumCharge ?? null,
        guideTotalPrice: guideTotalPrice,
      };
    }

    /* PRICE CALCULATION */
    const tourPriceAtBooking = schedule.price ?? tour.finalTourPrice;
    const totalPrice = tourPriceAtBooking + guideSnapshot.guideTotalPrice;

    const pricePerParticipantAtBooking =
      totalPrice / validateData.numberOfParticipants;

    /* Booking Code */
    const bookingCode = generateBookingCode("TBK");

    /* TRANSACTION */
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.tourBooking.create({
        data: {
          bookingCode,
          userId,
          tourId: validateData.tourId,
          scheduleId: validateData.scheduleId,
          destinationId: tour.destinationId,
          numberOfParticipants: validateData.numberOfParticipants,

          pricePerParticipantAtBooking,
          basePriceAtBooking: tour.basePrice,
          discountRateAtBooking: tour.discountRate,
          discountAmountAtBooking: tour.discountAmount,
          finalTourPrice: tour.finalTourPrice,

          needsGuide: validateData.needsGuide,
          numberOfGuides: validateData.numberOfGuideNeeds,

          guidePricingType: guideSnapshot.guidePricingType,
          guidePriceAtBooking: guideSnapshot.guidePriceAtBooking,
          guideMinimumCharge: guideSnapshot.guideMinimumCharge,
          guideTotalPrice: guideSnapshot.guideTotalPrice,

          totalPrice,
          status: BookingStatus.PENDING,
        },
        include: {
          tour: { include: { destination: true } },
          schedule: true,
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
        },
      });

      await tx.tourSchedule.update({
        where: { id: validateData.scheduleId },
        data: {
          currentBookings: { increment: validateData.numberOfParticipants },
        },
      });

      return newBooking;
    });

    next({
      status: 201,
      success: true,
      message: "Tour booking created successfully",
      data: {
        booking,
        message:
          "The total price is based on the selected schedule price and any guide fees. The tour's final price is the base tour price, which may differ from the schedule-specific pricing.",
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// Get my-bookings
const getUserTourBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.id;
    const { status, page, limit, sortBy, sortOrder } =
      getBookingQuerySchema.parse(req.query);

    const pageNumber = page || 1;
    const limitNumber = limit || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = { userId };
    if (status) {
      where.status = status as BookingStatus;
    }

    const validSortFields = [
      "bookingDate",
      "updatedAt",
      "cancelledAt",
      "completedAt",
    ];

    const sortField = validSortFields.includes(sortBy as string)
      ? (sortBy as string)
      : "bookingDate";

    const sortOrderValue = sortOrder?.toLowerCase() === "desc" ? "desc" : "asc";

    const [bookings, total] = await Promise.all([
      prisma.tourBooking.findMany({
        where,
        skip,
        take: limitNumber,
        include: {
          tour: {
            include: {
              destination: true,
            },
          },
          schedule: true,
          payment: true,
        },
        orderBy: { [sortField]: sortOrderValue },
      }),
      prisma.tourBooking.count({ where }),
    ]);

    next({
      status: 200,
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
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
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

//  Get single booking by ID (own booking)
const getUserTourBookingById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.id;
    const { bookingId } = bookingParamsSchema.parse(req.params);

    const booking = await prisma.tourBooking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      include: {
        tour: {
          include: {
            destination: true,
            itineraries: {
              orderBy: { day: "asc" },
            },
          },
        },
        schedule: true,
        payment: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!booking) {
      return next({
        status: 404,
        success: false,
        message: "Booking not found",
      });
    }

    next({ status: 200, success: true, data: booking });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// Cancel user's own booking
const cancelUserTourBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.id;
    const { bookingId } = bookingParamsSchema.parse(req.params);

    const booking = await prisma.tourBooking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      include: {
        schedule: true,
      },
    });

    if (!booking) {
      return next({
        status: 404,
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status === BookingStatus.CANCELLED) {
      return next({
        status: 400,
        success: false,
        message: "Booking already cancelled",
      });
    }

    if (booking.status === BookingStatus.COMPLETED) {
      return next({
        status: 400,
        success: false,
        message: "Cannot cancel completed booking",
      });
    }

    // Update booking and schedule in transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updated = await tx.tourBooking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
        },
        include: {
          tour: true,
          schedule: true,
          payment: true,
        },
      });

      // Release seats back to schedule
      await tx.tourSchedule.update({
        where: { id: booking.scheduleId },
        data: {
          currentBookings: {
            decrement: booking.numberOfParticipants,
          },
        },
      });

      return updated;
    });

    next({
      status: 200,
      success: true,
      message: "Booking cancelled successfully",
      data: updatedBooking,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// Get all bookings
const getAllTourBookings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      status,
      userId,
      tourId,
      scheduleId,
      destinationId,
      needsGuide,
      page,
      limit,
      sortBy,
      sortOrder,
    } = bookingQuerySchema.parse(req.query);

    const pageNumber = page ?? 1;
    const limitNumber = limit ?? 10;
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (tourId) where.tourId = tourId;
    if (destinationId) where.destinationId = destinationId;
    if (scheduleId) where.scheduleId = scheduleId;
    if (needsGuide) where.needsGuide = needsGuide;

    const validSortFields = [
      "bookingDate",
      "cancelledAt",
      "completedAt",
      "updatedAt",
    ];
    const sortField = validSortFields.includes(sortBy as string)
      ? (sortBy as string)
      : "bookingDate";

    const sortOrderValue = sortOrder?.toLowerCase() === "desc" ? "desc" : "asc";

    const [bookings, total] = await Promise.all([
      prisma.tourBooking.findMany({
        where,
        skip,
        take: limitNumber,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          tour: {
            include: {
              destination: true,
            },
          },
          schedule: true,
          payment: true,
        },
        orderBy: { [sortField]: sortOrderValue } as any,
      }),
      prisma.tourBooking.count({ where }),
    ]);

    next({
      status: 200,
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
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
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

//  Get single booking by ID
const getAdminTourBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { bookingId } = bookingParamsSchema.parse(req.params);

    const booking = await prisma.tourBooking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            country: true,
          },
        },
        tour: {
          include: {
            destination: true,
            itineraries: {
              orderBy: { day: "asc" },
            },
          },
        },
        schedule: true,
        payment: true,
      },
    });

    if (!booking) {
      return next({
        status: 404,
        success: false,
        message: "Booking not found",
      });
    }

    next({ status: 200, success: true, data: booking });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// update tour booking (user)
const updateTourBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validateData = updateBookingSchema.parse(req.body);
    const userId = req.id;
    const { bookingId } = bookingParamsSchema.parse(req.params);

    // Fetch existing booking
    const booking = await prisma.tourBooking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      include: {
        schedule: true,
        tour: true,
      },
    });

    if (!booking) {
      return next({
        status: 404,
        success: false,
        message: "Booking not found",
      });
    }

    // Only allow updates for PENDING bookings
    if (booking.status !== BookingStatus.PENDING) {
      return next({
        status: 400,
        success: false,
        message: "Only pending bookings can be updated",
      });
    }

    // Calculate participant difference for seat availability
    const participantDifference = validateData.numberOfParticipants
      ? validateData.numberOfParticipants - booking.numberOfParticipants
      : 0;

    // Check seat availability if participants are increasing
    if (participantDifference > 0) {
      const schedule = await prisma.tourSchedule.findUnique({
        where: { id: booking.scheduleId },
      });

      if (!schedule) {
        return next({
          status: 404,
          success: false,
          message: "Schedule not found",
        });
      }

      const availableSeats = schedule.availableSeats - schedule.currentBookings;

      if (availableSeats < participantDifference) {
        return next({
          status: 400,
          success: false,
          message: `Only ${availableSeats} seats available`,
        });
      }
    }

    // Min/Max participants validation
    const newParticipants =
      validateData.numberOfParticipants ?? booking.numberOfParticipants;

    if (
      booking.tour.minParticipants &&
      newParticipants < booking.tour.minParticipants
    ) {
      return next({
        status: 400,
        success: false,
        message: `Minimum ${booking.tour.minParticipants} participants required`,
      });
    }

    if (
      booking.tour.maxParticipants &&
      newParticipants > booking.tour.maxParticipants
    ) {
      return next({
        status: 400,
        success: false,
        message: `Maximum ${booking.tour.maxParticipants} participants allowed`,
      });
    }

    /* RECALCULATE GUIDE PRICING IF NEEDED */
    let guideSnapshot = {
      guidePricingType: booking.guidePricingType,
      guidePriceAtBooking: booking.guidePriceAtBooking,
      guideMinimumCharge: booking.guideMinimumCharge,
      guideTotalPrice: booking.guideTotalPrice,
      numberOfGuides: booking.numberOfGuides,
    };

    const needsGuide = validateData.needsGuide ?? booking.needsGuide;
    const guidePricingType =
      validateData.guidePricingType ?? booking.guidePricingType;
    const numberOfGuideNeeds =
      validateData.numberOfGuideNeeds ?? booking.numberOfGuides;

    // Recalculate if guide requirements changed
    if (
      needsGuide &&
      (validateData.needsGuide !== undefined ||
        validateData.numberOfParticipants !== undefined ||
        validateData.guidePricingType !== undefined ||
        validateData.numberOfGuideNeeds !== undefined)
    ) {
      // Fetch guide pricing
      let tourGuidePricing = await prisma.tourGuidePricing.findFirst({
        where: { tourId: booking.tourId, isActive: true },
      });

      if (!tourGuidePricing) {
        tourGuidePricing = await prisma.tourGuidePricing.findFirst({
          where: { isDefault: true, isActive: true },
        });
      }

      if (!tourGuidePricing) {
        return next({
          status: 404,
          success: false,
          message: "Active tour guide pricing not found",
        });
      }

      let guideTotalPrice = 0;
      let guidePriceAtBooking = 0;

      switch (guidePricingType) {
        case GuidePricingType.PER_DAY:
          guideTotalPrice =
            (tourGuidePricing.pricePerDay ?? 0) *
            (numberOfGuideNeeds ?? 1) *
            booking.tour.numberOfDays;
          guidePriceAtBooking = tourGuidePricing.pricePerDay ?? 0;
          break;

        case GuidePricingType.PER_PERSON:
          guideTotalPrice =
            (tourGuidePricing.pricePerPerson ?? 0) * newParticipants;
          guidePriceAtBooking = tourGuidePricing.pricePerPerson ?? 0;
          break;

        case GuidePricingType.PER_GROUP:
          guideTotalPrice = tourGuidePricing.pricePerGroup ?? 0;
          guidePriceAtBooking = tourGuidePricing.pricePerGroup ?? 0;
          break;

        default:
          return next({
            status: 400,
            success: false,
            message: "Invalid guide pricing type selected",
          });
      }

      // Minimum charge protection
      if (
        tourGuidePricing.minimumCharge &&
        guideTotalPrice < tourGuidePricing.minimumCharge
      ) {
        guideTotalPrice = tourGuidePricing.minimumCharge;
      }

      guideSnapshot = {
        guidePricingType: guidePricingType,
        guidePriceAtBooking: guidePriceAtBooking,
        guideMinimumCharge: tourGuidePricing.minimumCharge ?? null,
        guideTotalPrice: guideTotalPrice,
        numberOfGuides: numberOfGuideNeeds,
      };
    } else if (!needsGuide) {
      // Reset guide pricing if guide is not needed
      guideSnapshot = {
        guidePricingType: null,
        guidePriceAtBooking: 0,
        guideMinimumCharge: null,
        guideTotalPrice: 0,
        numberOfGuides: null,
      };
    }

    /* RECALCULATE TOTAL PRICE */
    const tourPriceAtBooking =
      booking.schedule.price ?? booking.tour.finalTourPrice;
    const totalPrice =
      tourPriceAtBooking + (guideSnapshot.guideTotalPrice ?? 0);
    const pricePerParticipantAtBooking = totalPrice / newParticipants;

    /* UPDATE TRANSACTION */
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking
      const updated = await tx.tourBooking.update({
        where: { id: bookingId },
        data: {
          numberOfParticipants: newParticipants,
          needsGuide: needsGuide,
          numberOfGuides: guideSnapshot.numberOfGuides,
          guidePricingType: guideSnapshot.guidePricingType,
          guidePriceAtBooking: guideSnapshot.guidePriceAtBooking,
          guideMinimumCharge: guideSnapshot.guideMinimumCharge,
          guideTotalPrice: guideSnapshot.guideTotalPrice,
          totalPrice: totalPrice,
          pricePerParticipantAtBooking: pricePerParticipantAtBooking,
        },
        include: {
          tour: { include: { destination: true } },
          schedule: true,
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
        },
      });

      // Update schedule bookings if participants changed
      if (participantDifference !== 0) {
        await tx.tourSchedule.update({
          where: { id: booking.scheduleId },
          data: {
            currentBookings: { increment: participantDifference },
          },
        });
      }

      return updated;
    });

    next({
      status: 200,
      success: true,
      message: "Booking updated successfully",
      data: {
        booking: updatedBooking,
        priceRecalculated:
          validateData.needsGuide !== undefined ||
          validateData.numberOfParticipants !== undefined,
        message:
          "The total price is based on the selected schedule price and any guide fees. The tour's final price is the base tour price, which may differ from the schedule-specific pricing.",
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// Reschedule tour booking
const rescheduleTourBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.id;
    const { bookingId } = bookingParamsSchema.parse(req.params);
    const { newScheduleId } = rescheduleBookingSchema.parse(req.body);

    if (!newScheduleId) {
      return next({
        status: 400,
        success: false,
        message: "New schedule ID is required",
      });
    }

    // Fetch existing booking
    const booking = await prisma.tourBooking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      include: {
        schedule: true,
        tour: true,
      },
    });

    if (!booking) {
      return next({
        status: 404,
        success: false,
        message: "Booking not found",
      });
    }

    // Only allow rescheduling for PENDING or CONFIRMED bookings
    if (
      ![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(
        booking.status as "PENDING" | "CONFIRMED",
      )
    ) {
      return next({
        status: 400,
        success: false,
        message: "Only pending or confirmed bookings can be rescheduled",
      });
    }

    // Check if trying to reschedule to the same schedule
    if (booking.scheduleId === newScheduleId) {
      return next({
        status: 400,
        success: false,
        message: "New schedule is the same as current schedule",
      });
    }

    // Verify new schedule exists and is active
    const newSchedule = await prisma.tourSchedule.findUnique({
      where: { id: newScheduleId },
    });

    if (!newSchedule || !newSchedule.isActive) {
      return next({
        status: 404,
        success: false,
        message: "New schedule not found or inactive",
      });
    }

    // Verify new schedule belongs to the same tour
    if (newSchedule.tourId !== booking.tourId) {
      return next({
        status: 400,
        success: false,
        message: "New schedule must belong to the same tour",
      });
    }

    // Check if new schedule date is in the future
    if (new Date(newSchedule.startDate) < new Date()) {
      return next({
        status: 400,
        success: false,
        message: "Cannot reschedule to a past date",
      });
    }

    // Check seat availability in new schedule
    const availableSeats =
      newSchedule.availableSeats - newSchedule.currentBookings;

    if (availableSeats < booking.numberOfParticipants) {
      return next({
        status: 400,
        success: false,
        message: `Only ${availableSeats} seats available in the new schedule`,
      });
    }

    /* RECALCULATE PRICE BASED ON NEW SCHEDULE */
    let guideSnapshot = {
      guidePricingType: booking.guidePricingType,
      guidePriceAtBooking: booking.guidePriceAtBooking,
      guideMinimumCharge: booking.guideMinimumCharge,
      guideTotalPrice: booking.guideTotalPrice,
    };

    // Recalculate guide pricing if needed
    if (booking.needsGuide) {
      let tourGuidePricing = await prisma.tourGuidePricing.findFirst({
        where: { tourId: booking.tourId, isActive: true },
      });

      if (!tourGuidePricing) {
        tourGuidePricing = await prisma.tourGuidePricing.findFirst({
          where: { isDefault: true, isActive: true },
        });
      }

      if (!tourGuidePricing) {
        return next({
          status: 404,
          success: false,
          message: "Active tour guide pricing not found",
        });
      }

      let guideTotalPrice = 0;
      let guidePriceAtBooking = 0;

      switch (booking.guidePricingType) {
        case GuidePricingType.PER_DAY:
          guideTotalPrice =
            (tourGuidePricing.pricePerDay ?? 0) *
            (booking.numberOfGuides ?? 1) *
            (booking.tour.numberOfDays ?? 1);
          guidePriceAtBooking = tourGuidePricing.pricePerDay ?? 0;
          break;

        case GuidePricingType.PER_PERSON:
          guideTotalPrice =
            (tourGuidePricing.pricePerPerson ?? 0) *
            booking.numberOfParticipants;
          guidePriceAtBooking = tourGuidePricing.pricePerPerson ?? 0;
          break;

        case GuidePricingType.PER_GROUP:
          guideTotalPrice = tourGuidePricing.pricePerGroup ?? 0;
          guidePriceAtBooking = tourGuidePricing.pricePerGroup ?? 0;
          break;
      }

      // Minimum charge protection
      if (
        tourGuidePricing.minimumCharge &&
        guideTotalPrice < tourGuidePricing.minimumCharge
      ) {
        guideTotalPrice = tourGuidePricing.minimumCharge;
      }

      guideSnapshot = {
        guidePricingType: booking.guidePricingType,
        guidePriceAtBooking: guidePriceAtBooking,
        guideMinimumCharge: tourGuidePricing.minimumCharge ?? null,
        guideTotalPrice: guideTotalPrice,
      };
    }

    // Calculate new total price based on new schedule price
    const newTourPriceAtBooking =
      newSchedule.price ?? booking.tour.finalTourPrice;
    const newTotalPrice =
      newTourPriceAtBooking + (guideSnapshot.guideTotalPrice ?? 0);
    const newPricePerParticipant = newTotalPrice / booking.numberOfParticipants;

    // Calculate price difference
    const priceDifference = newTotalPrice - booking.totalPrice;

    /* TRANSACTION */
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking with new schedule and recalculated prices
      const rescheduled = await tx.tourBooking.update({
        where: { id: bookingId },
        data: {
          scheduleId: newScheduleId,

          // Update guide pricing
          guidePriceAtBooking: guideSnapshot.guidePriceAtBooking,
          guideMinimumCharge: guideSnapshot.guideMinimumCharge,
          guideTotalPrice: guideSnapshot.guideTotalPrice,

          // Update total pricing
          pricePerParticipantAtBooking: newPricePerParticipant,
          totalPrice: newTotalPrice,

          updatedAt: new Date(),
        },
        include: {
          tour: { include: { destination: true } },
          schedule: true,
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
        },
      });

      // Decrement currentBookings from old schedule
      await tx.tourSchedule.update({
        where: { id: booking.scheduleId },
        data: {
          currentBookings: { decrement: booking.numberOfParticipants },
        },
      });

      // Increment currentBookings in new schedule
      await tx.tourSchedule.update({
        where: { id: newScheduleId },
        data: {
          currentBookings: { increment: booking.numberOfParticipants },
        },
      });

      return rescheduled;
    });

    next({
      status: 200,
      success: true,
      message: "Booking rescheduled successfully",
      data: {
        booking: updatedBooking,
        priceDifference: priceDifference,
        priceChanged: priceDifference !== 0,
        message:
          priceDifference > 0
            ? `Price increased by ${Math.abs(
                priceDifference,
              )}. Please pay the difference.`
            : priceDifference < 0
              ? `Price decreased by ${Math.abs(
                  priceDifference,
                )}. Refund will be processed.`
              : "Price remains the same.",
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// Update booking status (admin)
const updateTourBookingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { bookingId } = bookingParamsSchema.parse(req.params);
    const { status } = updateBookingStatusSchema.parse(req.body);

    const booking = await prisma.tourBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return next({
        status: 404,
        success: false,
        message: "Booking not found",
      });
    }

    const updateData: any = { status };

    if (status === BookingStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
    } else if (status === BookingStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const updated = await tx.tourBooking.update({
        where: { id: bookingId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          tour: true,
          schedule: true,
        },
      });

      // If cancelling, release seats back to schedule
      if (
        status === BookingStatus.CANCELLED &&
        booking.status !== BookingStatus.CANCELLED
      ) {
        await tx.tourSchedule.update({
          where: { id: booking.scheduleId },
          data: {
            currentBookings: {
              decrement: booking.numberOfParticipants,
            },
          },
        });
      }

      return updated;
    });

    next({
      status: 200,
      success: true,
      message: "Booking status updated successfully",
      data: updatedBooking,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// Get booking statistics
const getTourBookingStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      totalRevenue,
    ] = await Promise.all([
      prisma.tourBooking.count(),
      prisma.tourBooking.count({ where: { status: BookingStatus.PENDING } }),
      prisma.tourBooking.count({ where: { status: BookingStatus.CONFIRMED } }),
      prisma.tourBooking.count({ where: { status: BookingStatus.CANCELLED } }),
      prisma.tourBooking.count({ where: { status: BookingStatus.COMPLETED } }),
      prisma.tourBooking.aggregate({
        where: {
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
          },
        },
        _sum: {
          totalPrice: true,
        },
      }),
    ]);

    next({
      status: 200,
      success: true,
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        completedBookings,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
      },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

export {
  createTourBooking,
  getUserTourBookings,
  getUserTourBookingById,
  cancelUserTourBooking,
  getAllTourBookings,
  getAdminTourBookingById,
  updateTourBooking,
  rescheduleTourBooking,
  updateTourBookingStatus,
  getTourBookingStats,
};
