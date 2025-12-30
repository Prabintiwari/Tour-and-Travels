import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import cloudinary from "../config/cloudinary";
import { createTourSchema, updateTourSchema } from "../utils/zod";
import { PackageQueryParams } from "../types/tour.types";

// CREATE TOUR (WITHOUT ITINERARY)
const createTour = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createTourSchema.parse(req.body);

    // Check if destination exists
    const destination = await prisma.destination.findUnique({
      where: { id: validatedData.destinationId },
    });

    if (!destination) {
      return next({ status: 404, message: "Destination not found" });
    }

    const tour = await prisma.tour.create({
      data: {
        ...validatedData,
        maxParticipants: validatedData.maxParticipants || null,
        minParticipants: validatedData.minParticipants || null,
      },
      include: {
        destination: {
          select: { id: true, name: true, location: true },
        },
      },
    });

    next({
      status: 201,
      success: true,
      message: "Tour created successfully",
      data: tour,
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// GET TOUR BY ID WITH ALL RELATED DATA
const getTourById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tourId } = req.params;

    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      include: {
        destination: true,
        schedules: {
          orderBy: { startDate: "asc" },
        },
        faqs: {
          where: { isActive: true },
        },
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

    if (!tour) {
      return next({
        status: 404,
        success: false,
        message: "Tour not found",
      });
    }

    // Increment views
    await prisma.tour.update({
      where: { id: tourId },
      data: { views: { increment: 1 } },
    });

    next({
      status: 200,
      success: true,
      data: tour,
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// GET ALL TOURS WITH FILTERING
const getAllTours = async (
  req: Request<{}, {}, {}, PackageQueryParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = "1",
      limit = "10",
      destinationId,
      difficultyLevel,
      isFeatured,
      minPrice,
      maxPrice,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filters: any = { isActive: true };

    if (destinationId) filters.destinationId = destinationId;
    if (difficultyLevel) filters.difficultyLevel = difficultyLevel;
    if (isFeatured === "true") filters.isFeatured = true;

    // Search in title or description
    if (search) {
      filters.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filters.AND = [];
      if (minPrice)
        filters.AND.push({ basePrice: { gte: parseFloat(minPrice) } });
      if (maxPrice)
        filters.AND.push({ basePrice: { lte: parseFloat(maxPrice) } });
    }

    const tours = await prisma.tour.findMany({
      where: filters,
      skip,
      take: parseInt(limit),
      include: {
        destination: {
          select: { id: true, name: true, location: true },
        },
        reviews: {
          select: { rating: true },
        },
        _count: {
          select: { reviews: true, tourBookings: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.tour.count({ where: filters });

    // Calculate average rating
    const toursWithRating = tours.map((tour) => {
      const avgRating =
        tour.reviews.length > 0
          ? (
              tour.reviews.reduce((acc, r) => acc + r.rating, 0) /
              tour.reviews.length
            ).toFixed(1)
          : 0;

      const { reviews, ...rest } = tour;
      return { ...rest, averageRating: avgRating };
    });

    next({
      status: 200,
      success: true,
      data: {
        toursWithRating,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
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

// UPDATE TOUR
const updateTour = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tourId } = req.params;
    const validatedData = updateTourSchema.parse(req.body);

    // Check if tour exists
    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) {
      return next({ status: 404, message: "Tour not found" });
    }

    const updatedTour = await prisma.tour.update({
      where: { id: tourId },
      data: validatedData,
      include: {
        destination: {
          select: { id: true, name: true, location: true },
        },
      },
    });

    next({
      status: 200,
      success: true,
      message: "Tour updated successfully",
      data: updatedTour,
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// DELETE TOUR
const deleteTour = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tourId } = req.params;

    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) {
      return next({ status: 404, message: "Tour not found" });
    }

    // Delete images from Cloudinary
    if (tour.coverImagePublicId) {
      try {
        await cloudinary.uploader.destroy(tour.coverImagePublicId);
      } catch (error) {
        console.error("Failed to delete cover image:", error);
      }
    }

    for (const publicId of tour.imagePublicIds) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error(`Failed to delete image ${publicId}:`, error);
      }
    }

    // Delete tour (cascades to itineraryDetails, dayItinerary, activities)
    await prisma.tour.delete({ where: { id: tourId } });

    next({ status: 200, success: true, message: "Tour deleted successfully" });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ADD IMAGES
const addTourImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tourId } = req.params;
    const files = req.files as Express.Multer.File[];

    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) {
      return next({ status: 404, message: "Tour not found" });
    }

    if (!files || files.length === 0) {
      return next({
        status: 400,
        message: "At least one image is required",
      });
    }

    const coverImageUrl = files[0].path;
    const coverImagePublicId = files[0].filename;
    const imageUrls = files.slice(1).map((file: any) => file.path);
    const imagePublicIds = files.slice(1).map((file: any) => file.filename);

    const updatedTour = await prisma.tour.update({
      where: { id: tourId },
      data: {
        coverImage: coverImageUrl,
        coverImagePublicId: coverImagePublicId,
        images: {
          push: imageUrls,
        },
        imagePublicIds: {
          push: imagePublicIds,
        },
      },
    });

    next({
      status: 200,
      success: true,
      message: "Images added successfully",
      data: updatedTour,
    });
  } catch (error: any) {
    next({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// REMOVE IMAGES
const removeTourImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tourId } = req.params;
    const { imagePublicIds } = req.body;

    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) {
      return next({ status: 404, message: "Tour not found" });
    }

    if (!imagePublicIds || imagePublicIds.length === 0) {
      return next({ status: 400, message: "No images specified" });
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

    let updatedCoverImage;
    let updatedCoverImagePublicId;
    if (imagePublicIds.includes(tour.coverImagePublicId)) {
      updatedCoverImage = null;
      updatedCoverImagePublicId = null;
    }

    const updatedImageUrls = tour.images.filter(
      (_, index) => !imagePublicIds.includes(tour.imagePublicIds[index])
    );
    const updatedPublicIds = tour.imagePublicIds.filter(
      (id) => !imagePublicIds.includes(id)
    );

    const updatedTour = await prisma.tour.update({
      where: { id: tourId },
      data: {
        coverImage: updatedCoverImage,
        coverImagePublicId: updatedCoverImagePublicId,
        images: updatedImageUrls,
        imagePublicIds: updatedPublicIds,
      },
    });

    next({
      status: 200,
      success: true,
      message: `Successfully removed ${successfulDeletions.length} image(s)`,
      data: {
        ...updatedTour,
        totalImages: updatedTour.images.length,
        summary: {
          requested: imagePublicIds.length,
          successful: successfulDeletions.length,
          failed: failedDeletions.length,
        },
        failedDeletions: failedDeletions.length > 0 ? failedDeletions : null,
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

export {
  createTour,
  getTourById,
  getAllTours,
  updateTour,
  deleteTour,
  addTourImages,
  removeTourImages,
};
