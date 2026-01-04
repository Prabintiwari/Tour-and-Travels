import { Request, Response, NextFunction } from "express";
import { BookingStatus, GuidePricingType } from "@prisma/client";
import { generateBookingCode } from "../utils/generateBookingCode";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/auth";
import { createBookingSchema } from "../schema";

// Create a new tour booking
const createTourBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.id;
    if (!userId) {
      return next({
        status: 400,
        success: false,
        message: "User id is required!",
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
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get my-bookings
const getUserTourBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.id;
    const { status, page = "1", limit = "10" } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { userId };
    if (status) {
      where.status = status as BookingStatus;
    }

    const [bookings, total] = await Promise.all([
      prisma.tourBooking.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          tour: {
            include: {
              destination: true,
            },
          },
          schedule: true,
          payment: true,
        },
        orderBy: { bookingDate: "desc" },
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
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
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

//  Get single booking by ID (own booking)
const getUserTourBookingById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.id;
    const { bookingId } = req.params;

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
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//  * @desc    Cancel user's own booking
//  * @route   PATCH /api/bookings/tours/:id/cancel
const cancelUserTourBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.id;
    const { bookingId } = req.params;
    console.log(userId, bookingId);

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
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// /**
//  * @desc    Get all bookings (Admin)
//  * @route   GET /api/bookings/tours/admin/all
//  * @access  Private (Admin)
//  */
// const getAllTourBookings = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const {
//       status,
//       userId,
//       tourId,
//       page = 1,
//       limit = 10,
//       startDate,
//       endDate,
//     } = req.query;

//     const skip = (Number(page) - 1) * Number(limit);

//     const where: any = {};
//     if (status) where.status = status as BookingStatus;
//     if (userId) where.userId = userId as string;
//     if (tourId) where.tourId = tourId as string;
//     if (startDate || endDate) {
//       where.bookingDate = {};
//       if (startDate) where.bookingDate.gte = new Date(startDate as string);
//       if (endDate) where.bookingDate.lte = new Date(endDate as string);
//     }

//     const [bookings, total] = await Promise.all([
//       prisma.tourBooking.findMany({
//         where,
//         skip,
//         take: Number(limit),
//         include: {
//           user: {
//             select: {
//               id: true,
//               fullName: true,
//               email: true,
//               phone: true,
//             },
//           },
//           tour: {
//             include: {
//               destination: true,
//             },
//           },
//           schedule: true,
//           payment: true,
//         },
//         orderBy: { bookingDate: "desc" },
//       }),
//       prisma.tourBooking.count({ where }),
//     ]);

//     next({
//       status: 200,
//       success: true,
//       data: {
//         bookings,
//         pagination: {
//           total,
//           page: Number(page),
//           limit: Number(limit),
//           totalPages: Math.ceil(total / Number(limit)),
//         },
//       },
//     });
//   } catch (error: any) {
//     next({
//       status: 500,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// /**
//  * @desc    Get single booking by ID (Admin)
//  * @route   GET /api/bookings/tours/admin/:id
//  * @access  Private (Admin)
//  */
// const getAdminTourBookingById = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;

//     const booking = await prisma.tourBooking.findUnique({
//       where: { id },
//       include: {
//         user: {
//           select: {
//             id: true,
//             fullName: true,
//             email: true,
//             phone: true,
//             address: true,
//             city: true,
//             country: true,
//           },
//         },
//         tour: {
//           include: {
//             destination: true,
//             itineraries: {
//               orderBy: { day: "asc" },
//             },
//           },
//         },
//         schedule: true,
//         payment: true,
//       },
//     });

//     if (!booking) {
//       return next({
//         status: 404,
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     next({ status: 200, success: true, data: booking });
//   } catch (error: any) {
//     next({
//       status: 500,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// /**
//  * @desc    Update booking status (Admin)
//  * @route   PATCH /api/bookings/tours/admin/:id/status
//  * @access  Private (Admin)
//  */
// const updateTourBookingStatus = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const booking = await prisma.tourBooking.findUnique({
//       where: { id },
//     });

//     if (!booking) {
//       return next({
//         status: 404,
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     const updateData: any = { status };

//     if (status === BookingStatus.CANCELLED) {
//       updateData.cancelledAt = new Date();
//     } else if (status === BookingStatus.COMPLETED) {
//       updateData.completedAt = new Date();
//     }

//     const updatedBooking = await prisma.$transaction(async (tx) => {
//       const updated = await tx.tourBooking.update({
//         where: { id },
//         data: updateData,
//         include: {
//           user: {
//             select: {
//               id: true,
//               fullName: true,
//               email: true,
//             },
//           },
//           tour: true,
//           schedule: true,
//         },
//       });

//       // If cancelling, release seats
//       if (
//         status === BookingStatus.CANCELLED &&
//         booking.status !== BookingStatus.CANCELLED
//       ) {
//         await tx.tourSchedule.update({
//           where: { id: booking.scheduleId },
//           data: {
//             currentBookings: {
//               decrement: booking.numberOfParticipants,
//             },
//           },
//         });
//       }

//       return updated;
//     });

//     next({
//       status: 200,
//       success: true,
//       message: "Booking status updated successfully",
//       data: updatedBooking,
//     });
//   } catch (error: any) {
//     next({
//       status: 500,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// /**
//  * @desc    Get booking statistics (Admin)
//  * @route   GET /api/bookings/tours/admin/stats
//  * @access  Private (Admin)
//  */
// const getTourBookingStats = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const [
//       totalBookings,
//       pendingBookings,
//       confirmedBookings,
//       cancelledBookings,
//       completedBookings,
//       totalRevenue,
//     ] = await Promise.all([
//       prisma.tourBooking.count(),
//       prisma.tourBooking.count({ where: { status: BookingStatus.PENDING } }),
//       prisma.tourBooking.count({ where: { status: BookingStatus.CONFIRMED } }),
//       prisma.tourBooking.count({ where: { status: BookingStatus.CANCELLED } }),
//       prisma.tourBooking.count({ where: { status: BookingStatus.COMPLETED } }),
//       prisma.tourBooking.aggregate({
//         where: {
//           status: {
//             in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
//           },
//         },
//         _sum: {
//           totalPrice: true,
//         },
//       }),
//     ]);

//     next({
//       status: 200,
//       success: true,
//       data: {
//         totalBookings,
//         pendingBookings,
//         confirmedBookings,
//         cancelledBookings,
//         completedBookings,
//         totalRevenue: totalRevenue._sum.totalPrice || 0,
//       },
//     });
//   } catch (error: any) {
//     next({
//       status: 500,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

export {
  createTourBooking,
  getUserTourBookings,
  getUserTourBookingById,
  cancelUserTourBooking,
  //   getAllTourBookings,
  //   getAdminTourBookingById,
  //   updateTourBookingStatus,
  //   getTourBookingStats,
};
