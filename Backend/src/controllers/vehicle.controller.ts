import { Request, Response, NextFunction } from "express";
import {
  createVehicleSchema,
  vehicleParamsSchema,
} from "../schema/vehicle.schema";
import prisma from "../config/prisma";
import { VehicleStatus } from "@prisma/client";
import { ZodError } from "zod";

//Create a new vehicle
const createVehicle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createVehicleSchema.parse(req.body);

    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        brand: validatedData.brand,
        model: validatedData.model,
        year: validatedData.year,
        city: validatedData.city,
        status: { not: VehicleStatus.INACTIVE },
      },
    });

    if (existingVehicle) {
      return next({
        status: 409,
        message: "Vehicle with same details already exists",
      });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        ...validatedData,
        availableQuantity: validatedData.totalQuantity,
      },
    });

    next({
      status: 201,
      success: true,
      message: "Vehicle created successfully",
      data: vehicle,
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

// Get vehicle By id
const getVehicleById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { vehicleId } = vehicleParamsSchema.parse(req.params);

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId, status: { not: VehicleStatus.INACTIVE } },
      include: {
        faqs: { where: { isActive: true } },
        reviews: {
          include: {
            user: {
              select: { id: true, fullName: true, profileImage: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!vehicle) {
      return next({
        status: 404,
        success: false,
        message: "Vehicle not found!",
      });
    }
    const totalReviews = vehicle.reviews.length;
    const avgRating =
      vehicle.reviews.length > 0
        ? vehicle.reviews.reduce((a, r) => a + r.rating, 0) /
          vehicle.reviews.length
        : 0;
    next({
      status: 200,
      success: true,
      data: {
        vehicle,
        averageRating: Number(avgRating.toFixed(1)),
        totalReviews: totalReviews,
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

export { createVehicle,getVehicleById };
