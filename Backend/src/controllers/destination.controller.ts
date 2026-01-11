import { Request, Response, NextFunction } from "express";
import {
  destinationIdParamSchema,
  DestinationQueryParams,
  destinationSchema,
  getAllDestinationsQuerySchema,
  updateDestinationSchema,
} from "../schema";
import prisma from "../config/prisma";
import cloudinary from "../config/cloudinary";

// Create a new destination
const createDestination = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = destinationSchema.parse(req.body);
    const files = req.files as Express.Multer.File[];

    // Check if destination with same name already exists
    const existingDestination = await prisma.destination.findFirst({
      where: { name: validatedData.name },
    });

    if (existingDestination) {
      return next({
        status: 400,
        success: false,
        message: "Destination with this name already exists",
      });
    }

    // Handle image upload
    if (!files || files.length === 0) {
      return next({
        status: 400,
        message: "At least one image is required",
      });
    }

    const imageUrls = files.map((file) => file.path);
    const imagePublicIds = files.map((file: any) => file.filename);

    const destination = await prisma.destination.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        region: validatedData.region,
        location: validatedData.location,
        imageUrl: imageUrls[0],
        imagePublicId: imagePublicIds[0],
        bestTimeToVisit: validatedData.bestTimeToVisit,
        attractions: validatedData.attractions,
      },
    });

    next({
      status: 201,
      success: true,
      message: "Destination created successfully",
      data: { destination },
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get destination by ID
const getDestinationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { destinationId } = destinationIdParamSchema.parse(req.params);

    const destination = await prisma.destination.findUnique({
      where: { id: destinationId },
      include: {
        tours: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            basePrice: true,
            numberOfDays: true,
            difficultyLevel: true,
            isFeatured: true,
            coverImage: true,
            views: true,
            _count: {
              select: { reviews: true, tourBookings: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        destinationGalleries: {
          select: {
            id: true,
            imageUrl: true,
          },
        },
        tourReviews: {
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

    if (!destination) {
      return next({ status: 404, message: "Destination not found" });
    }

    // Increment views
    await prisma.destination.update({
      where: { id: destinationId },
      data: { views: { increment: 1 } },
    });

    next({
      status: 200,
      success: true,
      data: destination,
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all destinations with filtering and pagination
const getAllDestinations = async (
  req: Request<{}, {}, {}, DestinationQueryParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit, region, search, sortBy, order } =
      getAllDestinationsQuerySchema.parse(req.query);

    const pageNumber = page ?? 1;
    const limitNumber = limit ?? 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Build Prisma filter
    const filters: any = {};

    if (region) {
      filters.region = region;
    }

    if (search) {
      filters.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    // Validate sortBy
    const validSortFields = ["createdAt", "name", "views"];
    const sortField = validSortFields.includes(sortBy as any)
      ? (sortBy as any)
      : "createdAt";

    const sortOrder = order?.toLowerCase() === "asc" ? "asc" : "desc";

    const destinations = await prisma.destination.findMany({
      where: filters,
      skip,
      take: limitNumber,
      include: {
        tours: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            basePrice: true,
            numberOfDays: true,
            difficultyLevel: true,
          },
        },
        destinationGalleries: {
          select: {
            imageUrl: true,
          },
        },
        _count: {
          select: {
            tours: { where: { isActive: true } },
            tourReviews: true,
          },
        },
      },
      orderBy: { [sortField]: sortOrder },
    });

    const total = await prisma.destination.count({ where: filters });

    next({
      status: 200,
      success: true,
      data: destinations,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
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

// Get all regions
const getAllRegions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const regions = await prisma.destination.findMany({
      distinct: ["region"],
      where: {
        region: {
          not: null,
        },
      },
      select: {
        region: true,
      },
    });

    const regionList = regions.map((r) => r.region).filter(Boolean);

    next({
      status: 200,
      success: true,
      data: regionList,
      count: regionList.length,
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get popular destinations (by views)
const getPopularDestinations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const destinations = await prisma.destination.findMany({
      take: limit,
      orderBy: { views: "desc" },
      include: {
        tours: {
          where: { isActive: true },
          select: { id: true },
        },
        _count: {
          select: {
            tours: { where: { isActive: true } },
            tourReviews: true,
          },
        },
      },
    });

    next({ status: 200, success: true, data: destinations });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update destination details and image
const updateDestination = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { destinationId } = destinationIdParamSchema.parse(req.params);
    const validatedData = updateDestinationSchema.parse(req.body);

    // Check if destination exists
    const destination = await prisma.destination.findUnique({
      where: { id: destinationId },
    });
    if (!destination) {
      return next({
        status: 404,
        success: false,
        message: "Destination not found",
      });
    }

    // Check if new name already exists (if name is being updated)
    if (validatedData.name && validatedData.name !== destination.name) {
      const existingDestination = await prisma.destination.findFirst({
        where: { name: validatedData.name },
      });
      if (existingDestination) {
        return next({
          status: 400,
          success: false,
          message: "Destination with this name already exists",
        });
      }
    }
    // Handle image upload
    const files = req.files as Express.Multer.File[];
    let imageUrls;
    let imagePublicIds;
    if (files) {
      if (destination.imagePublicId) {
        await cloudinary.uploader.destroy(destination.imagePublicId);
      }
      imageUrls = files.map((file) => file.path);
      imagePublicIds = files.map((file: any) => file.filename);
    }
    const updatedData = {
      name: validatedData.name,
      description: validatedData.description,
      region: validatedData.region,
      location: validatedData.location,
      imageUrl: imageUrls ? imageUrls[0] : destination.imageUrl,
      imagePublicId: imagePublicIds
        ? imagePublicIds[0]
        : destination.imagePublicId,
      bestTimeToVisit: validatedData.bestTimeToVisit,
      attractions: validatedData.attractions,
    };

    const updatedDestination = await prisma.destination.update({
      where: { id: destinationId },
      data: updatedData,
    });

    next({
      status: 200,
      success: true,
      message: "Destination updated successfully",
      data: updatedDestination,
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete destination
const deleteDestination = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { destinationId } = destinationIdParamSchema.parse(req.params);

    const destination = await prisma.destination.findUnique({
      where: { id: destinationId },
    });
    if (!destination) {
      return next({
        status: 404,
        success: false,
        message: "Destination not found",
      });
    }

    // Check if destination has active tours
    const activeTours = await prisma.tour.findMany({
      where: {
        destinationId: destinationId,
        isActive: true,
      },
    });

    if (activeTours.length > 0) {
      return next({
        status: 400,
        success: false,
        message:
          "Cannot delete destination with active tours. Please deactivate or delete tours first.",
        tourCount: activeTours.length,
      });
    }

    // Delete image from Cloudinary if exists
    if (destination.imagePublicId) {
      await cloudinary.uploader.destroy(destination.imagePublicId);
    }

    // Delete destination (cascade will handle related data)
    await prisma.destination.delete({ where: { id: destinationId } });

    next({
      status: 200,
      success: true,
      message: "Destination deleted successfully",
    });
  } catch (error: any) {
    next({
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//  Get destination stats
const getDestinationStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { destinationId } = destinationIdParamSchema.parse(req.params);

    const destination = await prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      return next({
        status: 404,
        success: false,
        message: "Destination not found",
      });
    }

    const [toursCount, reviewsCount, bookingsCount, totalViews] =
      await Promise.all([
        prisma.tour.count({
          where: { destinationId: destinationId, isActive: true },
        }),
        prisma.tourReview.count({ where: { destinationId: destinationId } }),
        prisma.tourBooking.count({
          where: {
            destinationId,
            status: "COMPLETED",
          },
        }),
        prisma.destination.findUnique({
          where: { id: destinationId },
          select: { views: true },
        }),
      ]);

    const reviews = await prisma.tourReview.findMany({
      where: { id: destinationId },
      select: { rating: true },
    });

    const avgRating =
      reviews.length > 0
        ? (
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          ).toFixed(1)
        : 0;

    next({
      status: 200,
      success: true,
      data: {
        destinationName: destination.name,
        totalTours: toursCount,
        totalReviews: reviewsCount,
        averageRating: avgRating,
        completedBookings: bookingsCount,
        totalViews: totalViews?.views,
      },
    });
  } catch (error: any) {
    next({
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export {
  createDestination,
  getDestinationById,
  getAllDestinations,
  getAllRegions,
  getPopularDestinations,
  updateDestination,
  deleteDestination,
  getDestinationStats,
};
