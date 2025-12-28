import { Request, Response, NextFunction } from "express";
import { destinationSchema } from "../utils/zod";
import prisma from "../config/prisma";

interface GetAllDestinationsQuery {
  page?: string;
  limit?: string;
  region?: string;
  search?: string;
  sortBy?: string;
  order?: string;
}

// Create a new destination
const createDestination = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = destinationSchema.parse(req.body);

    // Check if destination with same name already exists
    const existingDestination = await prisma.destination.findFirst({
      where: { name: validatedData.name },
    });

    if (existingDestination) {
      return next({
        status: 400,
        message: "Destination with this name already exists",
      });
    }

    // Handle image upload
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return next({
        status: 400,
        message: "At least one image is required",
      });
    }

    const imageUrls = files.map((file) => file.path);

    const destination = await prisma.destination.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        region: validatedData.region,
        location: validatedData.location,
        imageUrl: imageUrls[0],
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
    const id = req.params.id;

    const destination = await prisma.destination.findUnique({
      where: { id },
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
      where: { id },
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
  req: Request<{}, {}, {}, GetAllDestinationsQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = "1",
      limit = "10",
      region,
      search,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
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

    const sortOrder = order.toLowerCase() === "asc" ? "asc" : "desc";

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
  console.log("hello i'm reach here!");
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



export {
  createDestination,
  getDestinationById,
  getAllDestinations,
  getAllRegions,
  getPopularDestinations,
};
