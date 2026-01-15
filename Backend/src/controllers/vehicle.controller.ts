import { Request, Response, NextFunction } from "express";
import { createVehicleSchema } from "../schema/vehicle.schema";
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
        message: error.issues||"Validation failed",
      });
    }
    next({
      status: 500,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

export { createVehicle };
