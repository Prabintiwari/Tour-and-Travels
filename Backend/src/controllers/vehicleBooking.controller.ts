import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { ZodError } from "zod";
import { AuthRequest } from "../middleware/auth";
import { RentalStatus, VehicleStatus } from "@prisma/client";
import { generateBookingCode } from "../utils/generateBookingCode";
import { CreateVehicleBookingSchema } from "../schema/vehicleBooking.schema";
import {
  calculateDiscounts,
  calculateDriverPricing,
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
      return res.status(401).json({ error: "Unauthorized" });
    }

    const validatedData = CreateVehicleBookingSchema.parse(req.body);

    // Fetch vehicle details
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: validatedData.vehicleId },
    });

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      return res.status(400).json({ error: "Vehicle is not available" });
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
      return res.status(400).json({
        error: "Insufficient vehicles available for selected dates",
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
          type: "DISCOUNT",
        },
        data: {
          usageCount: { increment: 1 },
        },
      });
    }

    return res.status(201).json({
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

export { createVehicleBooking };
