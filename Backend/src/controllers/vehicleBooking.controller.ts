import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { ZodError } from "zod";
import { AuthRequest } from "../middleware/auth";
import { PricingConfigType, RentalStatus, VehicleStatus } from "@prisma/client";
import { generateBookingCode } from "../utils/generateBookingCode";
import {
  BookingIdParamSchema,
  CancelBookingSchema,
  CreateVehicleBookingSchema,
  GetBookingsQuerySchema,
  getVehicleBookingQuerySchema,
  UpdateVehicleBookingSchema,
  updateVehicleBookingStatusSchema,
} from "../schema/vehicleBooking.schema";
import {
  calculateDiscounts,
  calculateDriverPricing,
  calculateRefund,
  getSeasonalMultiplier,
} from "../utils/vehicle_utils/calculatePricing";

// Create a new vehicle booking
const createVehicleBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.id;
    if (!userId) {
      return next({ status: 401, success: false, message: "Unauthorized" });
    }

    const validatedData = CreateVehicleBookingSchema.parse(req.body);

    // Fetch vehicle details
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: validatedData.vehicleId },
    });

    if (!vehicle) {
      return next({
        status: 404,
        success: false,
        message: "Vehicle not found",
      });
    }

    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      return next({
        status: 400,
        success: false,
        message: "Vehicle is not available",
      });
    }

    // Calculate duration
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Check vehicle availability
    const overlappingBookings = await prisma.vehicleBooking.count({
      where: {
        vehicleId: validatedData.vehicleId,
        status: {
          in: [
            RentalStatus.PENDING,
            RentalStatus.CONFIRMED,
            RentalStatus.ACTIVE,
          ],
        },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    const totalBookedVehicles = overlappingBookings;
    const availableCount = vehicle.availableQuantity - totalBookedVehicles;

    if (availableCount < validatedData.numberOfVehicles) {
      return next({
        status: 400,
        success: false,
        message: "Insufficient vehicles available for selected dates",
        data: {
          available: availableCount,
          requested: validatedData.numberOfVehicles,
        },
      });
    }

    // Calculate pricing with seasonal adjustment
    const seasonalMultiplier = await getSeasonalMultiplier(
      startDate,
      endDate,
      vehicle.vehicleType,
      vehicle.region || vehicle.city,
    );

    const adjustedPricePerDay = vehicle.pricePerDay * seasonalMultiplier;
    const vehicleBaseAmount =
      adjustedPricePerDay * durationDays * validatedData.numberOfVehicles;
    let grossAmount = vehicleBaseAmount;

    // Driver pricing calculation
    let driverTotalAmount = 0;
    let baseDriverRate: number | null = null;
    let distanceCharge = 0;
    let terrainCharge = 0;

    if (validatedData.needsDriver && validatedData.numberOfDrivers > 0) {
      const driverPricing = await calculateDriverPricing(
        validatedData.tourType,
        durationDays,
        validatedData.numberOfDrivers,
      );

      baseDriverRate = driverPricing.baseRate;
      distanceCharge = driverPricing.distanceCharge;
      terrainCharge = driverPricing.terrainCharge;
      driverTotalAmount = driverPricing.total;
      grossAmount += driverTotalAmount;
    }

    // Apply discounts
    const discountResult = await calculateDiscounts(
      grossAmount,
      durationDays,
      validatedData.couponCode,
      userId,
      vehicle.vehicleType,
    );

    if (discountResult.error) {
      return next({
        status: 400,
        success: false,
        message: discountResult.error,
      });
    }

    const totalPrice = grossAmount - discountResult.totalDiscount;
    const remainingAmount = totalPrice - validatedData.advanceAmount;

    // Generate unique booking code
    const bookingCode = generateBookingCode("VBK");

    // Create booking
    const booking = await prisma.vehicleBooking.create({
      data: {
        bookingCode,
        userId,
        vehicleId: validatedData.vehicleId,

        startDate,
        endDate,
        durationDays,
        numberOfVehicles: validatedData.numberOfVehicles,

        destination: validatedData.destination,
        pickupLocation: validatedData.pickupLocation,
        dropoffLocation: validatedData.dropoffLocation,
        tourType: validatedData.tourType,

        pricePerDayAtBooking: adjustedPricePerDay, // Store seasonally adjusted price
        vehicleBaseAmount,

        needsDriver: validatedData.needsDriver,
        numberOfDrivers: validatedData.numberOfDrivers,
        baseDriverRate,
        distanceCharge,
        terrainCharge,
        driverTotalAmount: validatedData.needsDriver ? driverTotalAmount : null,

        appliedDiscounts: discountResult.discounts,
        discountAmount: discountResult.totalDiscount,
        couponCode: validatedData.couponCode,

        grossAmount,
        totalPrice,
        advanceAmount: validatedData.advanceAmount,
        remainingAmount,

        specialRequests: validatedData.specialRequests,
        status: RentalStatus.PENDING,
      },
      include: {
        vehicle: true,
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

    // Update coupon usage if applicable
    if (validatedData.couponCode) {
      await prisma.pricingConfig.updateMany({
        where: {
          code: validatedData.couponCode,
          type: PricingConfigType.DISCOUNT,
        },
        data: {
          usageCount: { increment: 1 },
        },
      });
    }

    // Update vehicle availability - decrease available quantity
    await prisma.vehicle.update({
      where: { id: validatedData.vehicleId },
      data: {
        availableQuantity: {
          decrement: validatedData.numberOfVehicles,
        },
      },
    });

    // Update vehicle status if fully booked
    const updatedVehicle = await prisma.vehicle.findUnique({
      where: { id: validatedData.vehicleId },
    });

    if (updatedVehicle && updatedVehicle.availableQuantity <= 0) {
      await prisma.vehicle.update({
        where: { id: validatedData.vehicleId },
        data: {
          status: VehicleStatus.BOOKED,
        },
      });
    }

    return next({
      status: 201,
      success: true,
      message: "Booking created successfully",
      data: booking,
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

// Get my booking
const getUserVehicleBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.id;
    if (!userId) {
      return next({ status: 401, success: false, message: "Unauthorized" });
    }
    const { page, limit, status, tourType, sortOrder, sortBy } =
      getVehicleBookingQuerySchema.parse(req.query);
    const pageNumber = page || 1;
    const limitNumber = limit || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = { userId };
    if (status) where.status = status;
    if (tourType) where.tourType = tourType;

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

    const [vehicleBooking, total] = await Promise.all([
      prisma.vehicleBooking.findMany({
        where,
        skip,
        take: limit,
        include: {
          vehicle: {
            select: { id: true, brand: true, model: true, images: true },
          },
        },
        orderBy: { [sortField]: sortOrderValue },
      }),
      prisma.vehicleBooking.count({ where }),
    ]);

    next({
      status: 200,
      success: true,
      data: {
        vehicleBooking,
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

//  Get single vehicle booking by ID (own booking)
const getUserVehicleBookingById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.id;
    const { bookingId } = BookingIdParamSchema.parse(req.params);

    const booking = await prisma.vehicleBooking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      include: {
        vehicle: {
          select: { id: true, brand: true, model: true, images: true },
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
const cancelUserVehicleBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.id;
    const { bookingId } = BookingIdParamSchema.parse(req.params);
    const { cancellationReason } = CancelBookingSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return next({ status: 401, success: false, message: "Unauthorized" });
    }

    const vehicleBooking = await prisma.vehicleBooking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
    });

    if (!vehicleBooking) {
      return next({
        status: 404,
        success: false,
        message: "Booking not found",
      });
    }

    if (vehicleBooking.status === RentalStatus.CANCELLED) {
      return next({
        status: 400,
        success: false,
        message: "Booking already cancelled",
      });
    }

    if (vehicleBooking.status === RentalStatus.COMPLETED) {
      return next({
        status: 400,
        success: false,
        message: "Cannot cancel completed booking",
      });
    }

    const refund = await calculateRefund(vehicleBooking);

    // Update booking status
    const cancelledBooking = await prisma.vehicleBooking.update({
      where: { id: bookingId },
      data: {
        status: RentalStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason,
        cancelledBy: user.fullName,
        refundAmount: refund.refundAmount,
      },
    });

    // Restore vehicle availability
    await prisma.vehicle.update({
      where: { id: vehicleBooking.vehicleId },
      data: {
        availableQuantity: {
          increment: vehicleBooking.numberOfVehicles,
        },
      },
    });

    // Update vehicle status back to AVAILABLE if it was BOOKED
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleBooking.vehicleId },
    });

    if (vehicle && vehicle.status === VehicleStatus.BOOKED) {
      await prisma.vehicle.update({
        where: { id: vehicleBooking.vehicleId },
        data: {
          status: VehicleStatus.AVAILABLE,
        },
      });
    }

    next({
      status: 200,
      success: true,
      message: "Booking cancelled successfully",
      data: {
        booking: cancelledBooking,
        refundPercentage: refund.refundPercentage,
        refundAmount: refund.refundAmount,
        refundReason: refund.reason,
        refundPloicy: refund.policy,
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

// update vehicle booking
const updateVehicleBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.id;

    if (!userId) {
      return next({ status: 401, success: false, message: "Unauthorized" });
    }

    const { bookingId } = BookingIdParamSchema.parse(req.params);
    const updateData = UpdateVehicleBookingSchema.parse(req.body);

    const existingBooking = await prisma.vehicleBooking.findUnique({
      where: { id: bookingId, userId },
      include: { vehicle: true },
    });

    if (!existingBooking) {
      return next({ status: 404, sucess: false, message: "Booking not found" });
    }

    // Cannot update confirmed or completed bookings
    if (
      [RentalStatus.CONFIRMED, RentalStatus.COMPLETED].includes(
        existingBooking.status as "CONFIRMED" | "COMPLETED",
      )
    ) {
      return next({
        status: 400,
        success: false,
        message: "Cannot update confirmed or completed bookings",
      });
    }
    if (existingBooking.status === RentalStatus.CANCELLED) {
      return next({
        status: 400,
        success: false,
        message:
          "Booking is already cancelled by user. Cannot update cancelled booking",
      });
    }

    const needsPriceRecalculation =
      updateData.startDate ||
      updateData.endDate ||
      updateData.numberOfVehicles ||
      updateData.needsDriver !== undefined ||
      updateData.numberOfDrivers ||
      updateData.tourType ||
      updateData.couponCode !== undefined;

    // Recalculate if dates or quantities change
    let recalculatedData: any = {};
    let quantityChange = 0;

    if (needsPriceRecalculation) {
      // Get updated values
      const startDate = updateData.startDate
        ? new Date(updateData.startDate)
        : existingBooking.startDate;
      const endDate = updateData.endDate
        ? new Date(updateData.endDate)
        : existingBooking.endDate;
      const numberOfVehicles =
        updateData.numberOfVehicles ?? existingBooking.numberOfVehicles;
      const needsDriver = updateData.needsDriver ?? existingBooking.needsDriver;
      const numberOfDrivers =
        updateData.numberOfDrivers ?? existingBooking.numberOfDrivers;
      const tourType = updateData.tourType ?? existingBooking.tourType;
      const couponCode =
        updateData.couponCode !== undefined
          ? updateData.couponCode
          : existingBooking.couponCode;

      // Check vehicle availability
      const overlappingBookings = await prisma.vehicleBooking.count({
        where: {
          vehicleId: existingBooking.vehicleId,
          status: {
            in: [
              RentalStatus.PENDING,
              RentalStatus.CONFIRMED,
              RentalStatus.ACTIVE,
            ],
          },
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
          ],
        },
      });

      const totalBookedVehicles = overlappingBookings;
      const availableCount =
        existingBooking.vehicle.availableQuantity - totalBookedVehicles;

      if (availableCount < numberOfVehicles) {
        return next({
          status: 400,
          success: false,
          message: `Insufficient vehicles available for selected dates. Only ${availableCount} vehicle available`,
          data: {
            available: availableCount,
            requested: numberOfVehicles,
          },
        });
      }

      // Calculate quantity change for vehicle availability update
      quantityChange = numberOfVehicles - existingBooking.numberOfVehicles;

      // Calculate duration
      const durationDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Get seasonal multiplier
      const seasonalMultiplier = await getSeasonalMultiplier(
        startDate,
        endDate,
        existingBooking.vehicle.vehicleType,
        existingBooking.vehicle.region || existingBooking.vehicle.city,
      );

      const adjustedPricePerDay =
        existingBooking.vehicle.pricePerDay * seasonalMultiplier;
      const vehicleBaseAmount =
        adjustedPricePerDay * durationDays * numberOfVehicles;
      let grossAmount = vehicleBaseAmount;

      // Recalculate driver pricing
      let driverTotalAmount = 0;
      let baseDriverRate: number | null = null;
      let distanceCharge = 0;
      let terrainCharge = 0;

      if (needsDriver && numberOfDrivers > 0) {
        const driverPricing = await calculateDriverPricing(
          tourType || undefined,
          durationDays,
          numberOfDrivers,
        );

        baseDriverRate = driverPricing.baseRate;
        distanceCharge = driverPricing.distanceCharge;
        terrainCharge = driverPricing.terrainCharge;
        driverTotalAmount = driverPricing.total;
        grossAmount += driverTotalAmount;
      }
      console.log(baseDriverRate);

      // Recalculate discounts
      const discountResult = await calculateDiscounts(
        grossAmount,
        durationDays,
        couponCode || undefined,
        userId,
        existingBooking.vehicle.vehicleType,
      );

      // Check if there's an error with coupon
      if (discountResult.error) {
        return next({
          status: 400,
          success: false,
          message: discountResult.error,
        });
      }

      const totalPrice = grossAmount - discountResult.totalDiscount;
      const remainingAmount =
        totalPrice -
        (updateData.advanceAmount ?? existingBooking.advanceAmount);

      recalculatedData = {
        startDate,
        endDate,
        durationDays,
        numberOfVehicles,

        pricePerDayAtBooking: adjustedPricePerDay,
        vehicleBaseAmount,

        needsDriver,
        numberOfDrivers,
        baseDriverRate,
        distanceCharge,
        terrainCharge,
        driverTotalAmount: needsDriver ? driverTotalAmount : null,

        appliedDiscounts: discountResult.discounts,
        discountAmount: discountResult.totalDiscount,
        couponCode: couponCode || null,

        grossAmount,
        totalPrice,
        remainingAmount,
      };

      // Update coupon usage if coupon changed
      if (updateData.couponCode !== undefined) {
        // Decrement old coupon usage if exists
        if (
          existingBooking.couponCode &&
          existingBooking.couponCode !== couponCode
        ) {
          await prisma.pricingConfig.updateMany({
            where: {
              code: existingBooking.couponCode,
              type: PricingConfigType.DISCOUNT,
            },
            data: {
              usageCount: { decrement: 1 },
            },
          });
        }

        // Increment new coupon usage
        if (couponCode) {
          await prisma.pricingConfig.updateMany({
            where: {
              code: couponCode,
              type: PricingConfigType.DISCOUNT,
            },
            data: {
              usageCount: { increment: 1 },
            },
          });
        }
      }
    }

    const updatedBooking = await prisma.vehicleBooking.update({
      where: { id: bookingId },
      data: {
        ...updateData,
        ...recalculatedData,
      },
      include: {
        vehicle: true,
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

    // Update vehicle availability if quantity changed
    if (quantityChange !== 0) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: existingBooking.vehicleId },
      });

      if (vehicle) {
        const newAvailableQuantity = vehicle.availableQuantity - quantityChange;

        await prisma.vehicle.update({
          where: { id: existingBooking.vehicleId },
          data: {
            availableQuantity: newAvailableQuantity,
            status:
              newAvailableQuantity <= 0
                ? VehicleStatus.BOOKED
                : VehicleStatus.AVAILABLE,
          },
        });
      }
    }

    return next({
      status: 200,
      success: true,
      message: "Booking updated successfully",
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

// Get all bookings -(Admin)
const getAllVehicleBookings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status, userId, page, limit, sortBy, sortOrder } =
      GetBookingsQuerySchema.parse(req.query);

    const pageNumber = page ?? 1;
    const limitNumber = limit ?? 10;
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

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

    const [VehicleBooking, total] = await Promise.all([
      prisma.vehicleBooking.findMany({
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
          vehicle: {
            select: { id: true, brand: true, model: true, images: true },
          },
        },
        orderBy: { [sortField]: sortOrderValue } as any,
      }),
      prisma.vehicleBooking.count({ where }),
    ]);

    next({
      status: 200,
      success: true,
      data: {
        VehicleBooking,
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

//  Get single booking by ID -(Admin)
const getAdminVehicleBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { bookingId } = BookingIdParamSchema.parse(req.params);

    const VehicleBooking = await prisma.vehicleBooking.findUnique({
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
        vehicle: {
          select: { id: true, brand: true, model: true, images: true },
        },
        payment: true,
      },
    });

    if (!VehicleBooking) {
      return next({
        status: 404,
        success: false,
        message: "Booking not found",
      });
    }

    next({ status: 200, success: true, data: VehicleBooking });
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
const updateVehicleBookingBookingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { bookingId } = BookingIdParamSchema.parse(req.params);
    const { status } = updateVehicleBookingStatusSchema.parse(req.body);

    const vehicleBooking = await prisma.vehicleBooking.findUnique({
      where: { id: bookingId },
    });

    if (!vehicleBooking) {
      return next({
        status: 404,
        success: false,
        message: "Booking not found",
      });
    }

    const updateData: any = { status };

    if (status === RentalStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
    } else if (status === RentalStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    const updatedBooking = await prisma.vehicleBooking.update({
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
        vehicle: {
          select: { id: true, brand: true, model: true, images: true },
        },
        payment: true,
      },
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

export {
  createVehicleBooking,
  getUserVehicleBookings,
  getUserVehicleBookingById,
  cancelUserVehicleBooking,
  updateVehicleBooking,
  getAllVehicleBookings,
  getAdminVehicleBookingById,
  updateVehicleBookingBookingStatus,
};
