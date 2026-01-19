import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { ZodError } from "zod";
import { AuthRequest } from "../middleware/auth";
import { DiscountValueType, RentalStatus, TourType } from "@prisma/client";
import { generateBookingCode } from "../utils/generateBookingCode";
import { CreateVehicleBookingSchema } from "../schema/vehicleBooking.schema";

// Create a new vehicle booking
const createVehicleBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1️⃣ Validate input
    const data = CreateVehicleBookingSchema.parse(req.body);
    const userId = req.id;

    if (!userId) {
      return next({
        status: 400,
        success: false,
        message: "User id is required!",
      });
    }

    // 2️⃣ Fetch vehicle
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (data.needsDriver && !vehicle.hasDriver) {
      return res
        .status(400)
        .json({ message: "Driver not available for this vehicle" });
    }

    // 3️⃣ Dates & duration
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    const durationDays =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) || 1;

    // 4️⃣ Vehicle pricing
    const pricePerDay = vehicle.pricePerDay;
    const vehicleBaseAmount =
      pricePerDay * durationDays * data.numberOfVehicles;

    // 5️⃣ Driver pricing
    let baseDriverRate: number | null = null;
    let distanceCharge = 0;
    let terrainCharge = 0;
    let driverTotalAmount: number | null = null;

    if (data.needsDriver && data.numberOfDrivers > 0) {
      const driverConfig = await prisma.pricingConfig.findFirst({
        where: {
          type: "DRIVER",
          tourType: data.tourType,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (!driverConfig?.baseDriverRate) {
        return res
          .status(400)
          .json({ message: "Driver pricing not configured" });
      }

      baseDriverRate = driverConfig.baseDriverRate;

      if (data.estimatedDistance && driverConfig.pricePerKm) {
        distanceCharge = data.estimatedDistance * driverConfig.pricePerKm;
      }

      if (data.tourType === TourType.MOUNTAIN) {
        terrainCharge = baseDriverRate * (driverConfig.terrainMultiplier - 1);
      }

      driverTotalAmount =
        (baseDriverRate * durationDays + distanceCharge + terrainCharge) *
        data.numberOfDrivers;
    }

    // 6️⃣ Gross amount
    const grossAmount = vehicleBaseAmount + (driverTotalAmount ?? 0);

    // 7️⃣ Discount
    let discountAmount = 0;
    let appliedDiscounts: any[] = [];
    let couponCode: string | null = null;

    if (data.couponCode) {
      const coupon = await prisma.pricingConfig.findFirst({
        where: {
          type: "DISCOUNT",
          code: data.couponCode,
          isActive: true,
        },
      });

      if (!coupon) {
        return res.status(400).json({ message: "Invalid coupon code" });
      }

      if (coupon.minBookingAmount && grossAmount < coupon.minBookingAmount) {
        return res.status(400).json({ message: "Coupon not applicable" });
      }

      if (coupon.discountValueType === DiscountValueType.PERCENTAGE) {
        discountAmount = (grossAmount * (coupon.discountValue ?? 0)) / 100;
      } else {
        discountAmount = coupon.discountValue ?? 0;
      }

      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }

      appliedDiscounts.push({
        source: coupon.discountSource,
        valueType: coupon.discountValueType,
        value: coupon.discountValue,
        amount: discountAmount,
        code: coupon.code,
      });

      couponCode = coupon.code;
    }

    const bookingCode = generateBookingCode("VBK");

    // 8️⃣ Totals
    const totalPrice = Math.max(grossAmount - discountAmount, 0);
    const remainingAmount = totalPrice - data.advanceAmount;

    // 9️⃣ Create booking
    const booking = await prisma.vehicleBooking.create({
      data: {
        bookingCode: bookingCode,
        userId,
        vehicleId: data.vehicleId,

        startDate,
        endDate,
        durationDays,
        numberOfVehicles: data.numberOfVehicles,

        destination: data.destination,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        estimatedDistance: data.estimatedDistance,
        tourType: data.tourType,

        pricePerDayAtBooking: pricePerDay,
        vehicleBaseAmount,

        needsDriver: data.needsDriver,
        numberOfDrivers: data.numberOfDrivers,
        baseDriverRate,
        distanceCharge,
        terrainCharge,
        driverTotalAmount,

        appliedDiscounts,
        discountAmount,
        couponCode,

        grossAmount,
        totalPrice,
        advanceAmount: data.advanceAmount,
        remainingAmount,

        specialRequests: data.specialRequests,
        status: RentalStatus.PENDING,
      },
    });

    return res.status(201).json({
      message: "Vehicle booking created successfully",
      booking,
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
