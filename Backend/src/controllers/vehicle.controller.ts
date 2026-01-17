import { Request, Response, NextFunction } from "express";
import {
  adminVehicleQuerySchema,
  createVehicleSchema,
  publicVehicleQuerySchema,
  removeVehicleImagesBodySchema,
  updateVehicleSchema,
  updateVehicleStatusSchema,
  vehicleParamsSchema,
} from "../schema/vehicle.schema";
import prisma from "../config/prisma";
import { RentalStatus, VehicleStatus } from "@prisma/client";
import { ZodError } from "zod";
import { IMAGE_LIMITS } from "../config/constants/image.constants";
import cloudinary from "../config/cloudinary";
import { cleanupCloudinary } from "../middleware/upload";

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

// Get vehicle By id - (Public)
const getVehicleByIdPubic = async (
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
        message: "Vehicle not found or Inactive",
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

// Get vehicle By id including Inactive - (Admin)
const getVehicleByIdAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { vehicleId } = vehicleParamsSchema.parse(req.params);

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
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

// Get all vehicle - (Public)
const getAvailableVehicles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      vehicleType,
      city,
      region,
      fuelType,
      minPrice,
      maxPrice,
      minSeatCapacity,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = publicVehicleQuerySchema.parse(req.query);

    const skip = (page - 1) * limit;

    const where: any = { status: VehicleStatus.AVAILABLE };

    // Filter by vehicle type
    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    // Filter by location
    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (region) {
      where.region = { contains: region, mode: "insensitive" };
    }

    // Filter by fuel type
    if (fuelType) {
      where.fuelType = fuelType;
    }

    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.pricePerDay = {};
      if (minPrice !== undefined) {
        where.pricePerDay.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.pricePerDay.lte = maxPrice;
      }
    }

    // Filter by minimum seat capacity
    if (minSeatCapacity !== undefined) {
      where.seatCapacity = {
        gte: minSeatCapacity,
      };
    }

    if (search) {
      where.OR = [
        { brand: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { region: { contains: search, mode: "insensitive" } },
      ];
    }

    const validSortFields = [
      "pricePerDay",
      "year",
      "createdAt",
      "seatCapacity",
    ];
    const sortField = validSortFields.includes(sortBy as string)
      ? (sortBy as string)
      : "createdAt";

    const sortOrderValue = sortOrder?.toLowerCase() === "desc" ? "desc" : "asc";

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortOrderValue },
        include: {
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      }),
      prisma.vehicle.count({ where }),
    ]);

    // Calculate average rating for each vehicle
    const vehiclesWithStats = vehicles.map((vehicle) => {
      const avgRating =
        vehicle.reviews.length > 0
          ? vehicle.reviews.reduce((sum, r) => sum + r.rating, 0) /
            vehicle.reviews.length
          : 0;

      const { reviews, ...vehicleData } = vehicle;

      return {
        ...vehicleData,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: vehicle._count.reviews,
        totalBookings: vehicle._count.bookings,
      };
    });

    next({
      status: 200,
      success: true,
      data: {
        vehiclesWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        success: false,
        message: error.issues || "Validation failed",
        errors: error.issues,
      });
    }
    next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// Get all vehicle including Inactive - (Admin)
const getAllVehiclesAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      vehicleType,
      city,
      region,
      status,
      fuelType,
      minPrice,
      maxPrice,
      minSeatCapacity,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = adminVehicleQuerySchema.parse(req.query);

    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by vehicle type
    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    // Filter by location
    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (region) {
      where.region = { contains: region, mode: "insensitive" };
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by fuel type
    if (fuelType) {
      where.fuelType = fuelType;
    }

    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.pricePerDay = {};
      if (minPrice !== undefined) {
        where.pricePerDay.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.pricePerDay.lte = maxPrice;
      }
    }

    // Filter by minimum seat capacity
    if (minSeatCapacity !== undefined) {
      where.seatCapacity = {
        gte: minSeatCapacity,
      };
    }

    if (search) {
      where.OR = [
        { brand: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { region: { contains: search, mode: "insensitive" } },
      ];
    }

    const validSortFields = [
      "pricePerDay",
      "year",
      "createdAt",
      "seatCapacity",
    ];
    const sortField = validSortFields.includes(sortBy as string)
      ? (sortBy as string)
      : "createdAt";

    const sortOrderValue = sortOrder?.toLowerCase() === "desc" ? "desc" : "asc";

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortOrderValue },
        include: {
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
          reviews: {
            take: 5,
            select: {
              rating: true,
            },
          },
        },
      }),
      prisma.vehicle.count({ where }),
    ]);

    // Calculate average rating for each vehicle
    const vehiclesWithStats = vehicles.map((vehicle) => {
      const avgRating =
        vehicle.reviews.length > 0
          ? vehicle.reviews.reduce((sum, r) => sum + r.rating, 0) /
            vehicle.reviews.length
          : 0;

      const { reviews, ...vehicleData } = vehicle;

      return {
        ...vehicleData,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: vehicle._count.reviews,
        totalBookings: vehicle._count.bookings,
      };
    });

    next({
      status: 200,
      success: true,
      data: {
        vehiclesWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        success: false,
        message: error.issues || "Validation failed",
        errors: error.issues,
      });
    }
    next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// Update Vehicle
const updateVehicle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { vehicleId } = vehicleParamsSchema.parse(req.params);
    const validatedData = updateVehicleSchema.parse(req.body);

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!existingVehicle) {
      return next({
        status: 404,
        success: false,
        message: "Vehicle not found!",
      });
    }

    if (
      validatedData.brand ||
      validatedData.model ||
      validatedData.year ||
      validatedData.city
    ) {
      const duplicateVehicle = await prisma.vehicle.findFirst({
        where: {
          id: { not: vehicleId },
          brand: validatedData.brand ?? existingVehicle.brand,
          model: validatedData.model ?? existingVehicle.model,
          year: validatedData.year ?? existingVehicle.year,
          city: validatedData.city ?? existingVehicle.city,
        },
      });

      if (duplicateVehicle) {
        return next({
          status: 409,
          message: "Vehicle with same details already exists",
        });
      }
    }

    const newAvailable =
      validatedData.availableQuantity ?? existingVehicle.availableQuantity;
    const newTotal =
      validatedData.totalQuantity ?? existingVehicle.totalQuantity;

    if (newAvailable > newTotal) {
      return next({
        status: 400,
        success: false,
        message: "Available quantity cannot exceed total quantity",
      });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: validatedData,
    });

    next({
      status: 200,
      success: true,
      message: "Vehicle updated successfully",
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

// Delete Vehicle
const deleteVehicle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { vehicleId } = vehicleParamsSchema.parse(req.params);

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!existingVehicle) {
      return next({ status: 404, message: "Vehicle not found" });
    }

    // Check if vehicle has active/future bookings
    const activeBookings = await prisma.vehicleBooking.count({
      where: {
        vehicleId,
        status: { in: [RentalStatus.ACTIVE, RentalStatus.CONFIRMED] },
        endDate: { gte: new Date() },
      },
    });

    if (activeBookings > 0) {
      return next({
        status: 400,
        success: false,
        message: "Vehicle cannot be inactivated because it has active bookings",
      });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: VehicleStatus.INACTIVE },
    });

    next({
      status: 200,
      success: true,
      message: "Vehicle marked as inactive",
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

// add Images
const addVehicleImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let imagePublicIds: string[] = [];
  try {
    const { vehicleId } = vehicleParamsSchema.parse(req.params);
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return next({
        status: 400,
        success: false,
        message: "At least one image is required",
      });
    }
    const imageUrls = files.map((file) => file.path);
    imagePublicIds = files.map((file) => file.filename);

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        id: true,
        images: true,
        imagePublicIds: true,
      },
    });

    if (!vehicle) {
      await cleanupCloudinary(imagePublicIds);
      return next({
        status: 404,
        success: false,
        message: "Vehicle not found",
      });
    }

    // Max image limit check
    if (vehicle.images.length + files.length > IMAGE_LIMITS.VEHICLE) {
      await cleanupCloudinary(imagePublicIds);
      return next({
        status: 400,
        success: false,
        message: `Maximum ${IMAGE_LIMITS.VEHICLE} images allowed per vehicle`,
      });
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        images: {
          push: imageUrls,
        },
        imagePublicIds: {
          push: imagePublicIds,
        },
      },
      select: {
        id: true,
        brand: true,
        model: true,
        images: true,
        imagePublicIds: true,
      },
    });

    return next({
      status: 200,
      success: true,
      message: `${files.length} image(s) added successfully`,
      data: {
        vehicleId: updatedVehicle.id,
        vehicleName: `${updatedVehicle.brand} ${
          updatedVehicle.model || ""
        }`.trim(),
        previousCount: vehicle.images.length,
        addedCount: files.length,
        totalCount: updatedVehicle.images.length,
        remainingSlots: IMAGE_LIMITS.VEHICLE - updatedVehicle.images.length,
        images: updatedVehicle.images,
      },
    });
  } catch (error: any) {
    if (imagePublicIds.length > 0) {
      await cleanupCloudinary(imagePublicIds);
    }
    if (error instanceof ZodError) {
      return next({
        status: 400,
        success: false,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// Remove Images
const removeVehicleImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { vehicleId } = vehicleParamsSchema.parse(req.params);
    const { imagePublicIds } = removeVehicleImagesBodySchema.parse(req.body);

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      return next({
        status: 404,
        success: false,
        message: "Vehicle not found",
      });
    }

    const successfulDeletions: string[] = [];
    const failedDeletions: string[] = [];

    for (const publicId of imagePublicIds) {
      try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === "ok") {
          successfulDeletions.push(publicId);
        } else {
          failedDeletions.push(publicId);
        }
      } catch (error) {
        failedDeletions.push(publicId);
      }
    }
    const updatedImageUrls = vehicle.images.filter(
      (_, index) => !imagePublicIds.includes(vehicle.imagePublicIds[index])
    );
    const updatedPublicIds = vehicle.imagePublicIds.filter(
      (id) => !imagePublicIds.includes(id)
    );

    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { images: updatedImageUrls, imagePublicIds: updatedPublicIds },
    });

    next({
      status: 200,
      success: true,
      message: `Successfully removed ${successfulDeletions.length} image(s)`,
      data: {
        ...updatedVehicle,
        totalImages: updatedVehicle.images.length,
        summary: {
          requested: imagePublicIds.length,
          successful: successfulDeletions.length,
          failed: failedDeletions.length,
        },
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        success: false,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// Update vehicle status
const updateVehicleStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { vehicleId } = vehicleParamsSchema.parse(req.params);
    const { status } = updateVehicleStatusSchema.parse(req.body);

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      return next({
        status: 404,
        success: false,
        message: "Vehicle not found!",
      });
    }

    const updatedStatus = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status },
    });

    return next({
      status: 200,
      success: true,
      message: "Vehicle status updated successfully",
      data: updatedStatus,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return next({
        status: 400,
        success: false,
        message: error.issues || "Validation failed",
      });
    }
    next({
      status: 500,
      success: false,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

export {
  createVehicle,
  getVehicleByIdPubic,
  getVehicleByIdAdmin,
  getAllVehiclesAdmin,
  getAvailableVehicles,
  updateVehicle,
  deleteVehicle,
  addVehicleImages,
  removeVehicleImages,
  updateVehicleStatus,
};
